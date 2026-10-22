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

const rev=vm.createContext({supabase:{from:()=>({select:()=>({eq:async()=>({data:rev.rows,error:rev.error})})})}});
vm.runInContext(extract('isWorkOrderInvoiceRevision')+extract('nextWorkOrderInvoiceNumber')+extract('validateWorkOrderInvoiceRevisions'),rev);
assert.equal(rev.nextWorkOrderInvoiceNumber('W1',[]),'W1');
assert.equal(rev.nextWorkOrderInvoiceNumber('W1',[{invoice_no:'W1'}]),'W1R');
assert.equal(rev.nextWorkOrderInvoiceNumber('W1',[{invoice_no:'W1'},{invoice_no:'W1R'}]),'W1R1');
assert.equal(rev.nextWorkOrderInvoiceNumber('W1',[{invoice_no:'W1'},{invoice_no:'W1R'},{invoice_no:'W1R2'}]),'W1R3');
assert.equal(rev.isWorkOrderInvoiceRevision('W100020R12','W100020'),true);
assert.equal(rev.isWorkOrderInvoiceRevision('W1000200R','W100020'),false);
(async()=>{
 rev.rows=[{account:'AR',debit:100,credit:0,source:'Invoice',posting_date:'2026-10-01'},{account:'AR',debit:0,credit:100,source:'Invoice Reversal',posting_date:'2026-10-22'}];
 assert.equal(await rev.validateWorkOrderInvoiceRevisions([{invoice_no:'W1'}]),'2026-10-22');
 rev.rows[1].credit=90;await assert.rejects(rev.validateWorkOrderInvoiceRevisions([{invoice_no:'W1'}]),/not fully reversed/);
 rev.rows=[];await assert.rejects(rev.validateWorkOrderInvoiceRevisions([{invoice_no:'W1'}]),/not fully reversed/);
 rev.error=Error('Unavailable');await assert.rejects(rev.validateWorkOrderInvoiceRevisions([{invoice_no:'W1'}]),/Unavailable/);
})().catch(error=>{console.error(error);process.exitCode=1});
