const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
function extract(name) {
  const start = source.search(new RegExp('^(?:async )?function '+name+'\\(', 'm'));
  assert.ok(start >= 0);
  const rest = source.slice(start);
  const next = rest.slice(1).search(/\n(?:async )?function /);
  return next < 0 ? rest : rest.slice(0,next+1);
}
let response = {data:[],error:null};
const chain = {select(){return this},eq(){return this},limit(){return Promise.resolve(response)}};
const context = vm.createContext({supabase:{from(){return chain}}, effectivePartStatus:p=>p.status||'', workOrderPartSellingPrice:p=>p.selling_price});
for (const name of ['isBillableWorkOrderPart','repairPartsTotal','assertInvoiceHasNoReversalHistory']) vm.runInContext(extract(name),context);
const active = {sku:'HOSE',status:'Accepted',accepted_qty:1,selling_price:222.88};
for (const status of ['Voided','Cancelled','Canceled','Returned','Released','Removed','Reversed']) assert.equal(context.isBillableWorkOrderPart({...active,status}),false);
assert.equal(context.repairPartsTotal({bill_to_customer:'Customer',_parts:[active,{...active},{...active,status:'Voided',accepted_qty:2}]}),445.76);
assert.match(extract('invoiceWorkOrder'),/filter\(isBillableWorkOrderPart\)/);
assert.match(extract('ensureWorkOrderInvoiceCostLedger'),/filter\(isBillableWorkOrderPart\)/);
for (const name of ['saveInvoiceModal','reverseInvoice','postInvoiceLedger']) assert.match(extract(name),/assertInvoiceHasNoReversalHistory/);
(async()=>{
  await context.assertInvoiceHasNoReversalHistory('W1');
  response={data:[{id:'reversal'}],error:null};
  await assert.rejects(context.assertInvoiceHasNoReversalHistory('W1'),/reversal history/);
  response={data:null,error:new Error('Read failed')};
  await assert.rejects(context.assertInvoiceHasNoReversalHistory('W1'),/Read failed/);
  console.log('PASS: inactive parts excluded, legitimate repeated SKUs retained, invoice/cost totals filtered, reversed invoices and failed reads block mutation.');
})().catch(error=>{console.error(error);process.exitCode=1});
