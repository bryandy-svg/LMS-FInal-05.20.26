const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
function extract(name) {
  const start = source.search(new RegExp(`^(?:async )?function ${name}\\(`, 'm'));
  const rest = source.slice(start);
  const end = rest.indexOf('\n}', rest.indexOf('{')) + 2;
  return rest.slice(0, end);
}
const alerts = [];
let draft;
const context = vm.createContext({ alert: message => alerts.push(message), currentRows: [],
  getAll: async () => [], confirmSalesOrderInvoiceDraft: async (order, lines) => { draft = lines; return null; } });
for (const name of ['salesOrderCanEdit', 'salesOrderPostedLinesPreserved', 'invoiceSalesOrder']) vm.runInContext(extract(name), context);
const line = { product_id: 'part-1', qty: 10, issued_qty: 4, shipped_qty: 4, invoiced_qty: 4 };
const order = { order_no: 'SO-test', invoice_no: 'INV-first', status: 'Partially Invoiced', _lines: [line] };
assert.equal(context.salesOrderCanEdit(order), true);
assert.equal(context.salesOrderCanEdit({ ...order, _lines: [{ ...line, qty: 4 }] }), false);
for (const status of ['Paid', 'Void', 'Reversed', 'Cancelled']) assert.equal(context.salesOrderCanEdit({ ...order, status }), false);
assert.equal(context.salesOrderPostedLinesPreserved(order, [{ ...line, issued_qty: 7 }]), true);
assert.equal(context.salesOrderPostedLinesPreserved(order, []), false);
assert.equal(context.salesOrderPostedLinesPreserved(order, [{ ...line, qty: 3 }]), false);
assert.equal(context.salesOrderPostedLinesPreserved(order, [{ ...line, product_id: 'other' }]), false);
assert.equal(context.salesOrderPostedLinesPreserved(order, [{ ...line, invoiced_qty: 0 }]), false);
(async () => {
  context.currentRows = [order];
  await context.invoiceSalesOrder(order.order_no);
  assert.deepEqual(alerts, ['Nothing to invoice.']);
  assert.equal(draft, undefined);
  order._lines = [{ ...line, issued_qty: 7 }];
  await context.invoiceSalesOrder(order.order_no);
  assert.equal(draft.length, 1);
  assert.equal(draft[0].billQty, 3);
  assert.equal(draft[0].shipQty, 3);
  assert.match(extract('salesOrderRowHtml'), /const canEdit = salesOrderCanEdit\(order\)/);
  assert.match(extract('openSalesOrderModal'), /!salesOrderCanEdit\(order\)/);
  assert.doesNotMatch(extract('setupSalesOrderModalFooter'), /disabled = .*unbilledShipped/);
  console.log('PASS: partial editing, completed locks, posted quantity protection, empty invoice message, and incremental billing.');
})().catch(error => { console.error(error); process.exitCode = 1; });
