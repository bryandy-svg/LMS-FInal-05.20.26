const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js', 'utf8');
const start = source.indexOf('function effectivePartStatus(');
const end = source.indexOf('\nfunction ', start + 1);
const context = {};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
for (const status of ['Voided', 'Reversed', 'Returned', 'Cancelled']) {
  assert.equal(context.effectivePartStatus({ status, qty_needed: 3, accepted_qty: 3 }), status);
}
assert.equal(context.effectivePartStatus({ status: 'Reserved', qty_needed: 3, accepted_qty: 3 }), 'Accepted');
assert.equal(context.effectivePartStatus({ status: 'Reserved', qty_needed: 3, accepted_qty: 1 }), 'Partially Accepted');
const filterStart = source.indexOf('const partEntries = (wo._parts || []).filter', source.indexOf('async function printWorkOrderDraft'));
const filterEnd = source.indexOf('.map((part)', filterStart);
context.wo = { _parts: [{ sku: 'NAPAATF1QT', status: 'Voided', qty_needed: 3, accepted_qty: 3 }, { sku: 'ACTIVE', status: 'Accepted', qty_needed: 1, accepted_qty: 1 }] };
const expression = source.slice(filterStart, filterEnd).replace('const partEntries = ', '');
assert.equal(vm.runInContext(expression, context).length, 1);
assert.equal(vm.runInContext(expression, context)[0].sku, 'ACTIVE');
console.log('PASS: previously accepted voided parts excluded from PDF entries; active parts retained.');
