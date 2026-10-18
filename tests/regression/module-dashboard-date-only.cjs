const assert = require('node:assert/strict');
const vm = require('node:vm');
const { functions, source } = require('../source.cjs');
const data = {
 invoices: [{id:1,invoice_no:'A',invoice_date:'2026-09-01'}, {id:2,invoice_no:'B',invoice_date:'2026-10-01'}],
 invoice_lines: [{invoice_id:1,qty:2,rate:10},{invoice_id:2,qty:3,rate:20}],
 customer_payments: [{invoice_no:'B',amount:15,status:'Posted',payment_date:'2026-10-15'},{invoice_no:'B',amount:45,status:'Reversed'}]
};
const c = vm.createContext({moduleListScope:{query:'A',from:'2026-10-01',to:'2026-10-01'},getViewData:async(k,fn)=>fn(),getAll:async(table,options)=>{assert.equal(options.strict,true);return data[table];}});
vm.runInContext(functions(['moduleDashboardRows','loadModuleDashboardRows','loadInvoiceDashboardRows','invoiceTotal','invoicePaid','invoiceBalance']),c);
(async()=>{
 for (const field of ['wo_date','bid_date','start_date','opened_date','invoice_date']) {
  const rows=[{[field]:'2026-09-01'},{[field]:'2026-10-01'},{[field]:'2026-11-01'}];
  assert.equal(c.moduleDashboardRows(rows,field,{query:'missing',tab:'closed'}).length,3);
  assert.equal(c.moduleDashboardRows(rows,field,{from:'2026-10-01',to:'2026-10-01'}).length,1);
 }
 assert.equal(c.moduleDashboardRows([{},{}],'',{from:'2026-10-01'}).length,2);
 const invoices=await c.loadInvoiceDashboardRows();
 assert.equal(invoices.length,1);assert.equal(invoices[0].invoice_no,'B');
 assert.equal(c.invoiceTotal(invoices[0]),60);assert.equal(c.invoicePaid(invoices[0]),15);assert.equal(c.invoiceBalance(invoices[0]),45);
 for(const name of ['renderEquipmentRentalBidsView','renderRentalsView','renderInvoicesView','renderPropertyWorkOrdersView','renderAssetsView']) {
  const body=functions([name]);
  assert.ok(body.includes('dashboardRows'),name);
  const cards=body.match(/statCard\([^\n]+/g)||[];
  for(const card of cards) assert.ok(!card.split('</div>')[0].includes('currentRows'),name+' cards use complete summary rows');
 }
 console.log('PASS module dashboard scopes and invoice balances independent of table filters');
})().catch(e=>{console.error(e);process.exitCode=1});
