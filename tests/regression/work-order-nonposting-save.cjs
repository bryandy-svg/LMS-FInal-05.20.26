const vm = require('node:vm'), assert = require('node:assert/strict');
const {functions} = require('../source.cjs');
let checks = 0, writes = 0, submitted;
const part = {id:'part',product_id:'product',sku:'TEST',status:'Accepted',accepted_qty:1,qty_needed:2,unit_cost:10};
const values = {...part,product_lookup:'TEST',product_name:'Part',notes:'Edited description',selling_price:20};
const row = {dataset:{partId:'part'},querySelector:selector=>({value:values[selector.match(/="(.*?)"/)[1]] ?? ''})};
const c = {document:{querySelectorAll:selector=>selector==='#adminPartBody tr'?[row]:[]},
  productMeta:{products:[{id:'product',sku:'TEST',qty:10}]},profile:{full_name:'Tester'},
  resolveProductLookup:()=>({id:'product',sku:'TEST',name:'Part',qty:10}),calculatedWorkOrderPartPrice:()=>20,
  workOrderPartsPostingDate:async()=>{checks++;return null;},ensureWorkOrderAccountingAccounts:async()=>{},
  supabase:{from:table=>({select:()=>({eq:async()=>({data:table==='work_order_parts'?[part]:[],error:null})})}),
    rpc:async(name,args)=>{writes++;submitted=args;return {data:args.p_rows,error:null};}}};
vm.createContext(c); vm.runInContext(functions(['saveWorkOrderPartEdits']),c);
(async()=>{
  const wo={id:'wo',posting_date:'2026-08-01',_parts:[part]};
  await c.saveWorkOrderPartEdits(wo);
  assert.equal(checks,0,'Existing accepted parts must not trigger a posting-date check');
  assert.equal(writes,1);assert.equal(submitted.p_posting_date,null);
  assert.equal(submitted.p_rows[0].notes,'Edited description');
  values.accepted_qty=2;
  await assert.rejects(c.saveWorkOrderPartEdits(wo),/posting cancelled/);
  assert.equal(checks,1,'New acceptance still validates period');
  assert.equal(writes,1,'Blocked posting must not save parts');
  console.log('Historical non-posting edits save; new acceptance still enforces posting controls');
})().catch(error=>{console.error(error);process.exitCode=1});
