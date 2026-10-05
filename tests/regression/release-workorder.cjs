const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync('supabase-app/app.js','utf8');
const fields={};for(const id of ['cefWorkOrder','cefWorkOrderStatus','cefCustomer','cefAsset','cefAssetTag','cefEquipmentName','cefSerial','cefPlate','cefWorkCompleted','cefHeadMechanic','cefDropoff'])fields[id]={value:'',dataset:{},isConnected:true,addEventListener(){}};
let wo={id:'1',wo_no:'W1',asset_tag:'A1',bill_to_customer:'Customer',opening_mechanic:'Mechanic'};
const labor=[{work_done:'Replaced pump',mechanic:'Mechanic'},{work_done:'Replaced pump'},{work_done:'REVERSED wrong work'},{work_done:'Helper hours only'}];
let resolveLabor;
const ctx=vm.createContext({$:id=>fields[id],isReversedLabor:r=>r.work_done.startsWith('REVERSED'),isHelperLabor:r=>r.work_done.startsWith('Helper'),supabase:{from:table=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:wo}),order:()=>new Promise(resolve=>{resolveLabor=()=>resolve({data:labor});})})})})}});
const start=s.indexOf('function wireCustomerFormWorkOrder(');vm.runInContext(s.slice(start,s.indexOf('\n}',start)+2),ctx);
ctx.wireCustomerFormWorkOrder([{tag:'A1',name:'Excavator',serial:'S1',plate:'P1'}],[{form_no:'D1',work_order_no:'W1',asset_tag:'A1'}]);
(async()=>{
 fields.cefWorkOrder.value='W1';const first=fields.cefWorkOrder.onchange();await new Promise(setImmediate);resolveLabor();await first;
 assert.equal(fields.cefCustomer.value,'Customer');assert.equal(fields.cefSerial.value,'S1');assert.equal(fields.cefWorkCompleted.value,'Replaced pump');assert.equal(fields.cefDropoff.value,'D1');
 fields.cefWorkCompleted.value='Manually edited';const second=fields.cefWorkOrder.onchange();await new Promise(setImmediate);resolveLabor();await second;assert.equal(fields.cefWorkCompleted.value,'Manually edited');
 wo={...wo,bill_to_customer:'Stale customer'};const stale=fields.cefWorkOrder.onchange();await new Promise(setImmediate);fields.cefWorkOrder.value='W2';resolveLabor();await stale;assert.equal(fields.cefCustomer.value,'Customer');
 assert(s.indexOf('<label>Work Order (optional)</label><input id="cefWorkOrder"')<s.indexOf('<label>Customer *</label><input id="cefCustomer"'));
 console.log('PASS linked details, completed-work notes, helper/reversal exclusion, manual edits, stale response, field position');
})().catch(e=>{console.error(e);process.exitCode=1});
