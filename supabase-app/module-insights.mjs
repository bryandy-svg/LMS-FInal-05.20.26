const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
const divide = (a,b) => b > 0 && Number.isFinite(a) ? a/b : null;
const date = row => String(row.posting_date || row.entry_date || '').slice(0,10);
const dayCount = (from,to) => Math.round((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000)+1;

export function priorYearDate(value) {
  const [y,m,d]=value.split('-').map(Number),year=y-1;
  const last=new Date(Date.UTC(year,m,0)).getUTCDate();
  return year+'-'+String(m).padStart(2,'0')+'-'+String(Math.min(d,last)).padStart(2,'0');
}
export function changeText(current, previous, percent=false) {
  if(current===null||previous===null||!Number.isFinite(current)||!Number.isFinite(previous))return 'Change unavailable';
  const delta=current-previous;
  if(percent)return (delta>=0?'+':'')+(delta*100).toFixed(1)+' percentage points';
  if(previous<=0)return 'Change unavailable: prior value ≤ 0';
  return (delta>=0?'+':'')+(delta/previous*100).toFixed(1)+'%';
}

export function financialMetrics(gl, coa, from, to) {
  const chart = new Map(coa.map(a=>[String(a.account).trim().toLowerCase(),a]));
  const rows=gl.filter(r=>date(r) && date(r)<=to && !/draft|unposted|void|cancel/i.test(r.status || ''));
  const unknown=new Set();
  const type=r=>{const a=chart.get(String(r.account || '').trim().toLowerCase());if(!a)unknown.add(r.account || '(blank)');return String(a?.type || '').toLowerCase();};
  const isIncome=r=>/revenue|income/.test(type(r));
  const isExpense=r=>/expense|cost/.test(type(r));
  const pnl=(data)=>{let revenue=0,cogs=0,expense=0,interest=0,tax=0,da=0; for(const r of data){const n=number(r.debit)-number(r.credit);if(isIncome(r))revenue-=n;else if(isExpense(r)){expense+=n;if(/cogs|cost of (goods|sales)/i.test(r.account))cogs+=n;if(/interest/i.test(r.account))interest+=n;if(/income tax/i.test(r.account))tax+=n;if(/depreciation|amortization/i.test(r.account))da+=n;}}return {revenue,cogs,expense,net:revenue-expense,interest,tax,da};};
  const balance=data=>{const b={assets:0,liabilities:0,equity:0,cash:0,ar:0,ap:0,inventory:0,currentAssets:0,currentLiabilities:0,quick:0,unknownCurrent:[]};
    const grouped=new Map();for(const r of data){const key=r.account;const old=grouped.get(key)||{...r,debit:0,credit:0};old.debit+=number(r.debit);old.credit+=number(r.credit);grouped.set(key,old);}
    for(const r of grouped.values()){const t=type(r),name=r.account||'',n=number(r.debit)-number(r.credit);if(/asset/.test(t)){b.assets+=n;let known=true;
      if(/non.?current|long.?term/i.test(name)) { /* Explicit long-term accounts are not liquid. */ }
      else if(/cash|bank|checking|savings/i.test(name)&&!/receivable|expense|charges|fees/i.test(name)){b.cash+=n;b.currentAssets+=n;b.quick+=n;}
      else if(/receivable/i.test(name)){b.ar+=n;b.currentAssets+=n;b.quick+=n;}
      else if(/inventory/i.test(name)){b.inventory+=n;b.currentAssets+=n;}
      else if(/prepaid|work order parts.*wip|current asset/i.test(name))b.currentAssets+=n;
      else if(!/fixed|equipment|furniture|fixture|acc.*dep|non.?current|long.?term|land|building/i.test(name))known=false;
      if(!known&&Math.abs(n)>.005)b.unknownCurrent.push(name);
    }else if(/liability/.test(t)){b.liabilities-=n;if(/accounts? payable|a\/p/i.test(name))b.ap-=n;if(/accounts? payable|a\/p|accrual|credit card|customer deposit|parts in transit|wip|current liability/i.test(name)&&!/non.?current|long.?term/i.test(name))b.currentLiabilities-=n;else if(!/long.?term|non.?current/i.test(name)&&Math.abs(n)>.005)b.unknownCurrent.push(name);
    }else if(/equity/.test(t))b.equity-=n;}
    b.equity+=pnl(data).net;return b;};
  const period=rows.filter(r=>date(r)>=from), p=pnl(period), end=balance(rows), opening=balance(rows.filter(r=>date(r)<from));
  const days=dayCount(from,to), hasOpening=rows.some(r=>date(r)<from), avg=key=>hasOpening?(opening[key]+end[key])/2:0;
  const liquidity=end.unknownCurrent.length===0 && unknown.size===0;
  const ratios=[];const add=(label,value,formula,format='percent',reason='No positive denominator or insufficient opening history')=>ratios.push({label,value:unknown.size?null:value,formula,format,reason:unknown.size?'Unmapped ledger accounts':reason});
  add('Gross margin',divide(p.revenue-p.cogs,p.revenue),'(Revenue − COGS) ÷ revenue');
  add('Net margin',divide(p.net,p.revenue),'Net income ÷ revenue');
  add('COGS / revenue',divide(p.cogs,p.revenue),'Cost of sales ÷ revenue');
  add('Expense / revenue',divide(p.expense-p.cogs,p.revenue),'Expenses excluding COGS ÷ revenue');
  add('EBIT margin',divide(p.net+p.interest+p.tax,p.revenue),'(Net income + interest + income tax) ÷ revenue');
  add('EBITDA margin',divide(p.net+p.interest+p.tax+p.da,p.revenue),'(EBIT + depreciation + amortization) ÷ revenue');
  add('Return on assets',divide(p.net,avg('assets')),'Period net income ÷ average opening/closing assets');
  add('Return on equity',divide(p.net,avg('equity')),'Period net income ÷ average opening/closing equity');
  add('Asset turnover',divide(p.revenue,avg('assets')),'Period revenue ÷ average assets','multiple');
  add('Inventory turnover',divide(p.cogs,avg('inventory')),'Period COGS ÷ average inventory','multiple');
  add('Inventory days',hasOpening&&p.cogs>0?avg('inventory')/p.cogs*days:null,'Average inventory ÷ COGS × period days','days');
  add('Liabilities / assets',divide(end.liabilities,end.assets),'Total liabilities ÷ total assets');
  add('Liabilities / equity',divide(end.liabilities,end.equity),'Total liabilities ÷ equity (includes cumulative earnings)','multiple');
  add('Equity / assets',divide(end.equity,end.assets),'Equity ÷ assets');
  add('Interest coverage',divide(p.net+p.interest+p.tax,p.interest),'EBIT ÷ interest expense','multiple');
  add('Current ratio',liquidity?divide(end.currentAssets,end.currentLiabilities):null,'Current assets ÷ current liabilities','multiple','Current/non-current account classification is incomplete');
  add('Quick ratio',liquidity?divide(end.quick,end.currentLiabilities):null,'Cash + receivables ÷ current liabilities','multiple','Current/non-current account classification is incomplete');
  add('Cash ratio',liquidity?divide(end.cash,end.currentLiabilities):null,'Cash ÷ current liabilities','multiple','Current/non-current account classification is incomplete');
  const monthly=new Map(), revenues=new Map(), expenses=new Map();
  for(const r of period){const month=date(r).slice(0,7),m=monthly.get(month)||{revenue:0,expense:0};const n=number(r.debit)-number(r.credit);if(isIncome(r)){m.revenue-=n;revenues.set(r.account,(revenues.get(r.account)||0)-n);}if(isExpense(r)){m.expense+=n;expenses.set(r.account,(expenses.get(r.account)||0)+n);}monthly.set(month,m);}
  return {p,end,opening,ratios,days,rows:rows.length,unknown:[...unknown],monthly:[...monthly].sort(([a],[b])=>a.localeCompare(b)),revenues:[...revenues],expenses:[...expenses],liquidity,imbalance:rows.reduce((s,r)=>s+number(r.debit)-number(r.credit),0),undated:gl.filter(r=>!date(r)).length};
}

function bars(title, entries, currency=false) {
  const sorted=entries.filter(([,n])=>Number.isFinite(n)).slice(0,12), max=Math.max(1,...sorted.map(([,n])=>Math.abs(n)));
  return '<section class="insight-chart"><h4>'+esc(title)+(entries.length>12?' (12 of '+entries.length+')':'')+'</h4>'+ (sorted.length?sorted.map(([label,n])=>'<div class="insight-bar-row"><span title="'+esc(label)+'">'+esc(label)+'</span><div class="insight-track"><i style="width:'+Math.abs(n)/max*100+'%;background:'+(n<0?'#b94b47':'#197c8b')+'"></i></div><b>'+esc(currency?money(n):n)+'</b></div>').join(''):'<p>No activity in this period.</p>')+'</section>';
}
function card(label,value,note=''){return '<div class="insight-card"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(note)+'</small></div>';}
export function financialHtml(m,from,to,previous=null) {
  const compareCard=(label,value,old,note='')=>card(label,money(value),note+(previous?' · Last year '+money(old)+' · '+changeText(value,old):''));
  const ratioValue=r=>r.value===null?'N/A':r.format==='percent'?(r.value*100).toFixed(1)+'%':r.value.toFixed(2)+(r.format==='days'?' days':'×');
  return '<p class="insight-note">'+esc(from)+' to '+esc(to)+' · Guam dates · '+m.rows+' ledger rows through period end. Balances are as of the end date; returns and turnover cover the selected period, not annualized.</p>'+
    (m.unknown.length?'<p class="notice">Unmapped accounts: '+esc(m.unknown.join(', '))+'. Ratios are unavailable until these accounts are classified.</p>':'')+
    (Math.abs(m.imbalance)>.01?'<p class="notice">Ledger debits and credits differ by '+money(m.imbalance)+'. Review Accounting before relying on these figures.</p>':'')+
    (m.undated?'<p class="notice">'+m.undated+' undated ledger rows were excluded.</p>':'')+
    '<div class="insight-cards">'+compareCard('Revenue',m.p.revenue,previous?.p.revenue)+compareCard('Gross profit',m.p.revenue-m.p.cogs,previous?previous.p.revenue-previous.p.cogs:0)+compareCard('Net income',m.p.net,previous?.p.net)+compareCard('Cash / bank',m.end.cash,previous?.end.cash)+compareCard('Receivables',m.end.ar,previous?.end.ar,'GL balance, not an aging report')+compareCard('Payables',m.end.ap,previous?.end.ap,'GL balance, includes credits')+compareCard('Inventory',m.end.inventory,previous?.end.inventory,'Ledger carrying cost')+card('Working capital',m.liquidity?money(m.end.currentAssets-m.end.currentLiabilities):'N/A','Current assets − current liabilities')+'</div>'+
    '<div class="insight-charts">'+bars('Monthly revenue',m.monthly.map(([k,v])=>[k,v.revenue]),true)+bars('Monthly net income',m.monthly.map(([k,v])=>[k,v.revenue-v.expense]),true)+(previous?bars('Last year monthly revenue',previous.monthly.map(([k,v])=>[k,v.revenue]),true)+bars('Last year monthly net income',previous.monthly.map(([k,v])=>[k,v.revenue-v.expense]),true):'')+bars('Revenue by account',m.revenues.sort((a,b)=>b[1]-a[1]),true)+bars('Expenses by account',m.expenses.sort((a,b)=>b[1]-a[1]),true)+'</div>'+
    '<details><summary>Financial ratios ('+m.ratios.length+')</summary><div class="insight-cards">'+m.ratios.map((r,i)=>card(r.label,ratioValue(r),r.formula+(r.value===null?' · '+r.reason:'')+(previous?' · Last year '+ratioValue(previous.ratios[i])+' · '+changeText(r.value,previous.ratios[i].value,r.format==='percent'):''))).join('')+'</div></details>'+
    '<details><summary>Calculation notes and data gaps</summary><p>Average balances use opening and closing values. No opening history means average-based ratios are unavailable. Revenue includes all income accounts. COGS, interest, income tax and depreciation use matching account names. Reversal entries remain included so they offset the original postings. Draft, unposted, void and cancelled entries are excluded. This is a ledger management view, not a cash-flow statement.</p><p>Current/non-current classification still needed: '+esc(m.end.unknownCurrent.join(', ')||'None detected')+'. DSO, DPO, cash conversion cycle, debt service coverage and budget variances need reliable credit sales, credit purchases, debt schedules or budgets and are not inferred.</p><p>Formula reference: <a href="https://www.cfainstitute.org/sites/default/files/-/media/documents/support/programs/cfa/cfa_program_level_ii_financial_ratio_list.pdf" target="_blank" rel="noopener">CFA Institute financial ratio list</a>.</p></details>';
}

export function moduleMetrics(rows, kind) {
  const groups=new Map();for(const r of rows){const status=String(r.status || r.payment_status || r.type || 'Not specified');groups.set(status,(groups.get(status)||0)+1);}
  const cards=[['Records',rows.length,'Selected date range; independent of list filters']];
  const cancelled=rows.filter(r=>/cancel|void|revers/i.test(r.status||''));const active=rows.filter(r=>!/cancel|void|revers/i.test(r.status||''));
  if(cancelled.length)cards.push(['Cancelled / voided',cancelled.length,'Excluded from values below']);
  if(kind==='inventory'){const qty=active.reduce((s,r)=>s+number(r.qty),0),value=active.reduce((s,r)=>s+number(r.qty)*number(r.cost),0),low=active.filter(r=>number(r.qty)<=number(r.reorder_point)).length;cards.push(['On-hand quantity',qty,'Current product snapshot'],['Stock carrying value',money(value),'On-hand × stored inventory cost'],['At / below reorder',low,'Includes zero stock'],['Reorder rate',active.length?(100*low/active.length).toFixed(1)+'%':'N/A','Low-stock products ÷ products']);}
  if(kind==='quotes'){const converted=active.filter(r=>r.sales_order_no || r.linked_sales_order_no || /convert/i.test(r.status||'')).length;cards.push(['Converted quotes',converted,'Has a sales-order link or converted status'],['Conversion rate',active.length?(100*converted/active.length).toFixed(1)+'%':'N/A','Converted ÷ non-cancelled quotes']);}
  if(['repairs','rentals','purchasing','orders','tickets'].includes(kind)){const closed=active.filter(r=>/closed|complete|invoiced|paid|fulfilled|returned/i.test(r.status||r.payment_status||'')).length;cards.push(['Completed / closed',closed,'Based on saved status'],['Completion rate',active.length?(100*closed/active.length).toFixed(1)+'%':'N/A','Completed ÷ non-cancelled records']);}
  if(kind==='fleet'){const repair=active.filter(r=>/repair|down|out of service|inoperable/i.test(r.status||'')).length;cards.push(['Out of service / repair',repair,'Based on saved equipment status']);}
  if(active.some(r=>Number.isFinite(r._insightAmount)))cards.push(['Document value',money(active.reduce((s,r)=>s+number(r._insightAmount),0)),'Non-cancelled documents; not recognized revenue']);
  return {cards,groups:[...groups].sort((a,b)=>b[1]-a[1])};
}

export function datedModuleRows(data, from, to) {
  if (!data.dateField) return {rows:data.rows,note:'Current master-data snapshot; historical status is not stored. Dates do not change these snapshot values.'};
  const rows=data.rows.filter(r=>{const d=String(r[data.dateField] || '').slice(0,10);return d && d>=from && d<=to;});
  const missing=data.rows.filter(r=>!r[data.dateField]).length;
  return {rows,note:from+' to '+to+' · By '+data.dateField.replaceAll('_',' ')+' · Saved current status of records dated in this period'+(missing?' · '+missing+' undated records excluded':'')};
}

export function moduleHtml(data, from, to, compare) {
  const selected=datedModuleRows(data,from,to),m=moduleMetrics(selected.rows,data.kind);
  if(!data.dateField)m.cards[0][2]='Current master snapshot';
  const priorFrom=priorYearDate(from),priorTo=priorYearDate(to);
  const hasPrior=data.dateField && data.rows.some(r=>r[data.dateField] && String(r[data.dateField]).slice(0,10)<=priorTo);
  const prior=compare&&hasPrior?moduleMetrics(datedModuleRows(data,priorFrom,priorTo).rows,data.kind):null;
  const addInventory=(metrics,cutoff)=>{const b=data.inventoryAt(cutoff);metrics.cards.push(['On hand as of '+cutoff,b.qty,'Dated stock movements, including reversals'],['Inventory value as of '+cutoff,money(b.value),'Stock movement carrying cost']);};
  if(data.inventoryAt){addInventory(m,to);if(prior)addInventory(prior,priorTo);}
  return '<p class="insight-note">'+esc(selected.note)+' · Guam dates</p><div class="insight-cards">'+m.cards.map((c,i)=>{
    const old=prior?.cards.find(p=>p[0]===c[0]) || (data.inventoryAt&&i>=m.cards.length-2?prior?.cards[i]:null);
    const n=v=>v==='N/A'?null:Number(String(v).replace(/[$,%]/g,''));
    const percent=String(c[1]).endsWith('%');
    return card(c[0],c[1],c[2]+(old?' · Last year '+old[1]+' · '+changeText(percent?n(c[1])/100:n(c[1]),percent?n(old[1])/100:n(old[1]),percent):''));
  }).join('')+'</div>'+bars('Status / type distribution',m.groups)+
    (data.dateField?bars('Records by month',[...selected.rows.reduce((map,r)=>{const k=String(r[data.dateField]).slice(0,7);map.set(k,(map.get(k)||0)+1);return map;},new Map())].sort(([a],[b])=>a.localeCompare(b))):'')+
    (prior?bars('Last year status / type distribution',prior.groups)+'<p>Comparison: '+priorFrom+' to '+priorTo+'</p>':compare?'<p>Prior-year history is unavailable; comparison is not inferred.</p>':'');
}

export function mountInsights({host,view,title,financial,load,today,isCurrent}) {
  if(!host || host.querySelector('#moduleInsights'))return;
  const panel=document.createElement('details');panel.id='moduleInsights';panel.className='module-insights';
  panel.innerHTML='<summary><strong>'+esc(financial?'Financial overview':'Summary & charts')+'</strong><span>'+esc(title)+' · Expand to view</span></summary><div class="insight-body"></div>';
  host.prepend(panel);const body=panel.querySelector('.insight-body');let busy=false,loaded=false;
  const run=async(refresh=false)=>{if(busy)return;busy=true;body.setAttribute('aria-busy','true');
    const from=body.querySelector('[data-insight-from]')?.value ?? today.slice(0,4)+'-01-01',to=body.querySelector('[data-insight-to]')?.value??today;
    const compare=body.querySelector('[data-insight-compare]')?.checked || false;
    if(!from||!to||from>to){busy=false;body.removeAttribute('aria-busy');return alert('Choose a valid From / To period.');}
    body.innerHTML='<p role="status">Loading complete summary…</p>';
    try{const data=await load(refresh);if(!panel.isConnected||!isCurrent())return;
      body.innerHTML='<div class="insight-controls"><label>From <input type="date" data-insight-from value="'+esc(from)+'"></label><label>To <input type="date" data-insight-to value="'+esc(to)+'"></label><label><input type="checkbox" data-insight-compare '+(compare?'checked':'')+'> Compare with last year</label><button type="button" data-insight-apply>Apply</button><button type="button" data-insight-refresh>Refresh summary</button></div><div class="insight-scroll">'+(financial?financialHtml(financialMetrics(data.gl,data.coa,from,to),from,to,compare&&data.gl.some(r=>date(r)<=priorYearDate(to))?financialMetrics(data.gl,data.coa,priorYearDate(from),priorYearDate(to)):null)+(compare?'<p class="insight-note">Comparison: '+priorYearDate(from)+' to '+priorYearDate(to)+(data.gl.some(r=>date(r)<=priorYearDate(to))?'':' · No prior-year ledger history; comparison unavailable')+'</p>':''):moduleHtml(data,from,to,compare))+'</div>';
      body.querySelector('[data-insight-apply]')?.addEventListener('click',()=>run());body.querySelector('[data-insight-refresh]').onclick=()=>run(true);loaded=true;
    }catch(error){if(panel.isConnected){body.innerHTML='<p role="alert">Could not load summary: '+esc(error.message||error)+'</p><button type="button">Retry</button>';body.querySelector('button').onclick=()=>run(true);}}finally{busy=false;body.removeAttribute('aria-busy');}
  };
  panel.addEventListener('toggle',()=>{if(panel.open&&!loaded)void run();});
}
