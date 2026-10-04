const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
const names=['laborBreakMinutes','laborHours','laborOvertimeHours','laborRegularHours','laborOvertimeMultiplier','effectivePartStatus','workOrderPartSellingPrice','workOrderDraftIncome'];
const context=vm.createContext({customerPricingRow:()=>null,isReversedLabor:r=>Boolean(r.reversed)});
for(const name of names){const start=source.indexOf('function '+name+'(');assert(start>=0);const end=source.indexOf('\n}',start)+2;vm.runInContext(source.slice(start,end),context);}
const wo={bill_to_customer:'PORT AUTHORITY OF GUAM'};
const labor=(hours,rate,ot=0)=>({clock_in:'2026-09-01T00:00:00Z',clock_out:new Date(Date.parse('2026-09-01T00:00:00Z')+hours*3600000).toISOString(),hourly_rate:rate,overtime_hours:ot});
const rows=[labor(177,200,4.5),labor(170,200,4.5),labor(6,0)];
const parts=[{status:'Voided',accepted_qty:3,unit_cost:9.99,selling_price:15.4}];
assert.equal(context.workOrderDraftIncome(wo,parts,rows),70300);
assert.equal(context.workOrderDraftIncome(wo,[{status:'Accepted',accepted_qty:2,selling_price:25}],rows),70350);
assert.equal(context.workOrderDraftIncome(wo,parts,[...rows,{...labor(4,200),reversed:true}]),70300);
assert.equal((source.match(/"Income to Date"/g)||[]).length,2);
assert.equal((source.match(/"open_age_days", "income_to_date", "status"/g)||[]).length,2);
assert(source.includes('income_to_date: workOrderDraftIncome(wo, woParts, woLabor)'));
console.log('PASS: W100017 total $70,300; voids, reversals, parts, both aging columns.');
