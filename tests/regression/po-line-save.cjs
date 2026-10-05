const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
function extract(name) {
  const start = source.indexOf(`async function ${name}(`);
  assert.ok(start >= 0);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return rest.slice(0, end + 1);
}
const db = new Map();
let failWrite = false, failDelete = false, saveCount = 0, release;
const context = vm.createContext({
  Set, Error,
  upsertManyWithOptionalColumns: async (table, rows) => {
    if (failWrite) throw new Error('write failed');
    for (const row of rows) db.set(row.id, row);
  },
  supabase: { from: () => ({ delete: () => ({ eq: (_, poId) => ({ in: (_, ids) => ({ select: async () => {
    if (failDelete) return { error: new Error('delete failed') };
    const removed = ids.filter(id => db.get(id)?.po_id === poId);
    removed.forEach(id => db.delete(id));
    return { data: removed.map(id => ({ id })) };
  } }) }) }) }) },
  performPurchaseOrderSave: async () => { saveCount++; await new Promise(resolve => { release = resolve; }); },
});
vm.runInContext('let purchaseOrderSaveInProgress = false;\n' + extract('savePurchaseOrderModal') + '\n' + extract('savePurchaseOrderLines'), context);
(async () => {
  const lines = [{ id: 'a', sku: '1665225', qty: 1, unit_cost: 72.10 }, { id: 'b', sku: '1668356', qty: 1, unit_cost: 67.37 }];
  await context.savePurchaseOrderLines('po', lines);
  await Promise.all([context.savePurchaseOrderLines('po', lines, lines), context.savePurchaseOrderLines('po', lines, lines)]);
  assert.equal(db.size, 2, 'Repeated/overlapping saves must not duplicate lines');
  assert.equal([...db.values()].reduce((sum, r) => sum + r.qty * r.unit_cost, 0), 139.47);
  failWrite = true;
  await assert.rejects(context.savePurchaseOrderLines('po', [lines[0]], lines), /write failed/);
  assert.equal(db.size, 2, 'A failed save must not erase existing lines');
  failWrite = false;
  failDelete = true;
  await assert.rejects(context.savePurchaseOrderLines('po', [lines[0]], lines), /delete failed/);
  failDelete = false;
  await context.savePurchaseOrderLines('po', [lines[0]], lines);
  assert.equal(db.size, 1);
  await assert.rejects(context.savePurchaseOrderLines('po', [{ sku: 'missing-id' }]), /identity/);
  const first = context.savePurchaseOrderModal();
  await context.savePurchaseOrderModal({ receiveAfterSave: true });
  assert.equal(saveCount, 1, 'All PO actions share a save lock');
  release(); await first;
  const retry = context.savePurchaseOrderModal();
  assert.equal(saveCount, 2, 'Save lock releases after completion');
  release(); await retry;
  console.log('PASS: stable PO lines, concurrent saves, totals, failure retention, deletion errors, and save lock.');
})().catch(error => { console.error(error); process.exitCode = 1; });
