const assert=require('node:assert/strict');
(async()=>{
const {financialMetrics,financialHtml,moduleMetrics,datedModuleRows,moduleHtml,priorYearDate,changeText}=await import('../../supabase-app/module-insights.mjs');
const coa=[['Cash','Asset'],['Accounts Receivable','Asset'],['Parts Inventory','Asset'],['Accounts Payable','Liability'],['Capital','Equity'],['Sales','Revenue'],['COGS','Expense'],['Rent','Expense']].map(([account,type])=>({account,type}));
const row=(account,debit,credit,date)=>({account,debit,credit,posting_date:date,status:'Posted'});
const gl=[row('Cash',100,0,'2025-12-31'),row('Parts Inventory',100,0,'2025-12-31'),row('Accounts Payable',0,50,'2025-12-31'),row('Capital',0,150,'2025-12-31'),row('Cash',200,0,'2026-01-15'),row('Sales',0,200,'2026-01-15'),row('COGS',60,0,'2026-01-15'),row('Parts Inventory',0,60,'2026-01-15'),row('Rent',20,0,'2026-01-15'),row('Cash',0,20,'2026-01-15'),{...row('Sales',0,999,'2026-01-20'),status:'Draft'},row('Sales',0,888,'2026-02-01')];
let m=financialMetrics(gl,coa,'2026-01-01','2026-01-31');
assert.equal(m.p.revenue,200);assert.equal(m.p.net,120);assert.equal(m.end.assets,320);assert.equal(m.end.equity,270);assert.equal(m.imbalance,0);assert.equal(m.ratios.find(r=>r.label==='Gross margin').value,.7);assert.equal(m.ratios.find(r=>r.label==='Current ratio').value,6.4);assert.equal(m.ratios.find(r=>r.label==='Inventory turnover').value,60/70);
assert.equal(financialMetrics([],coa,'2026-01-01','2026-01-31').ratios[0].value,null);
m=financialMetrics([...gl,row('Mystery',1,0,'2026-01-01')],coa,'2026-01-01','2026-01-31');assert(m.ratios.every(r=>r.value===null));
assert.equal(priorYearDate('2024-02-29'),'2023-02-28');assert.equal(priorYearDate('2026-10-12'),'2025-10-12');assert.match(changeText(10,0),/unavailable/);assert.equal(changeText(110,100),'+10.0%');
const data={kind:'quotes',dateField:'quote_date',rows:[{quote_date:'2026-01-31',status:'Converted',sales_order_no:'SO1'},{quote_date:'2026-02-01'},{quote_date:'2025-01-15',status:'Draft'},{}]};
assert.equal(datedModuleRows(data,'2026-01-01','2026-01-31').rows.length,1);assert.match(moduleHtml(data,'2026-01-01','2026-01-31',true),/Last year/);assert.match(moduleHtml({rows:[],kind:'fleet'},'2026-01-01','2026-01-31',true),/unavailable/);
assert.match(financialHtml(m,'2026-01-01','2026-01-31'),/Unmapped/);
console.log('Financial balances, period boundaries, unavailable ratios, leap-year comparisons and module filtering verified.');
})().catch(e=>{console.error(e);process.exitCode=1;});
