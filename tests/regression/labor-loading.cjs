const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
function extract(name){const start=source.search(new RegExp(`(?:async )?function ${name}\\(`));assert.ok(start>=0,name);const rest=source.slice(start);return rest.slice(0,rest.slice(1).search(/\n(?:async )?function /)+1);}
let failedTable='',hang=false,fastTimeout=false,upsertError=null;
const requests=[],elements={},alerts=[];
const moves=Array.from({length:1001},(_,i)=>({id:i,status:'Finalized'}));
const data={trucking_moves:moves,app_profiles:[{id:'driver',full_name:'Test Driver',role:'Trucking Driver',modules:[],trucking_labor_rate:10}],trucking_payroll_hours:[{id:1,payroll_date:'2026-09-21',driver_name:'Test Driver',total_hours:8}]};
const c=vm.createContext({getViewData: (_name, loader) => loader(new AbortController().signal),AbortController,Promise,Map,Set,Error,console,clearTimeout,setTimeout:(fn,ms)=>setTimeout(fn,fastTimeout?5:ms),
  productMeta:{},normalizeModules:v=>v||[],esc:v=>String(v||''),$:id=>elements[id]||(elements[id]={}),
  truckingLaborDetailHtml:()=>'<table>details</table>',openTruckingDriverLaborRates(){},downloadTruckingPayrollHoursTemplate(){},uploadTruckingPayrollHours(){},openManualTruckingPayrollHours(){},
  closeModal(){},alert:msg=>alerts.push(msg),
  supabase:{from(table){let from=0,to=999;const q={select(columns){requests.push({table,columns});return q;},order(){return q;},range(a,b){from=a;to=b;return q;},abortSignal(){return q;},eq(){return q;},then(resolve){if(hang)return new Promise(()=>{});return Promise.resolve(table===failedTable?{error:{message:'Network failed'}}:{data:data[table].slice(from,to+1)}).then(resolve);},upsert:async()=>({error:upsertError})};return q;}}
});
for(const name of ['readTruckingLaborRows','loadTruckingLaborLookups','rememberSavedTruckingPayrollHours','renderTruckingLaborDetailsView'])vm.runInContext(extract(name),c);
(async()=>{
  await c.loadTruckingLaborLookups();
  assert.equal(c.productMeta.truckingLaborMoves.length,1001,'Pagination must retain every ticket');
  assert.equal(c.productMeta.truckingPayrollPeople.length,1);
  assert.deepEqual([...new Set(requests.map(r=>r.table))].sort(),['app_profiles','trucking_moves','trucking_payroll_hours']);
  assert.ok(requests.filter(r=>r.table==='trucking_moves').every(r=>!r.columns.includes('*')&&!r.columns.includes('signature')));
  const prior=c.productMeta.truckingPayrollHours;failedTable='trucking_payroll_hours';
  await assert.rejects(c.loadTruckingLaborLookups(),/Network failed/);
  assert.equal(c.productMeta.truckingPayrollHours,prior,'Failed reads must preserve cached saved hours');
  await c.renderTruckingLaborDetailsView();
  assert.ok(elements.content.innerHTML.includes('Retry'));
  failedTable='';hang=true;fastTimeout=true;
  await assert.rejects(c.loadTruckingLaborLookups(),/timed out/);hang=false;fastTimeout=false;
  c.rememberSavedTruckingPayrollHours([{payroll_date:'2026-09-21',driver_name:'Test Driver',total_hours:9}]);
  assert.equal(c.productMeta.truckingPayrollHours.length,1);assert.equal(c.productMeta.truckingPayrollHours[0].total_hours,9);
  const manual=extract('openManualTruckingPayrollHours');
  const start=manual.indexOf('    try {\n      const { error } = await supabase.from("trucking_payroll_hours")');
  assert.ok(start>0);const body=manual.slice(start,manual.indexOf('\n  };',start));
  c.records=[{payroll_date:'2026-09-21',driver_name:'Test Driver',total_hours:10}];c.enteredCount=1;
  const before=requests.length;await vm.runInContext('(async()=>{'+body+'})()',c);
  assert.equal(requests.length,before,'Saving must not trigger any data reload');
  assert.ok(alerts.at(-1).startsWith('Saved 1'));assert.ok(elements.content.innerHTML.includes('Saved 1'));
  upsertError={message:'Write failed'};await vm.runInContext('(async()=>{'+body+'})()',c);
  assert.equal(alerts.at(-1),'Write failed');
  console.log('PASS: focused reads, pagination, preserved cache on failure, timeout, Retry, save confirmation, no post-save reload, write failure.');
})().catch(e=>{console.error(e);process.exitCode=1});
