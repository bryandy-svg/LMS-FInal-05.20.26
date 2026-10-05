const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
function extract(name) {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return end < 0 ? rest : rest.slice(0, end + 1);
}
const alerts = [];
const fields = { start_time: '19:00:00', end_time: '10:07:00' };
const context = vm.createContext({
  alert: message => alerts.push(message),
  modalBody: {
    querySelectorAll: () => Object.entries(fields).map(([name, value]) => ({ name, value })),
    querySelector: selector => ({ value: fields[selector.match(/name="([^"]+)"/)[1]] || '' }),
  },
  assignedDriverOperationalUpdate: () => ({ move_date: '2026-09-17', standby_hours: 0 }),
});
vm.runInContext(extract('truckingTimeOrderError'), context);
const check = context.truckingTimeOrderError;
assert.match(check('19:00:00', '10:07:00'), /Time In cannot be later/);
assert.ok(check('10:07:01', '10:07:00'));
assert.ok(check('23:59', '00:00'));
for (const [start, end] of [['10:07', '19:00'], ['10:07', '10:07:00'], ['', ''], [null, '10:07'], ['19:00', null]]) {
  assert.equal(check(start, end), '');
}
(async () => {
  for (const name of ['saveManualFinalTruckingTicket', 'saveManualTruckingTicketDraft', 'saveTruckingMove', 'saveAssignedDriverTask', 'finalizeAssignedDriverTask']) {
    vm.runInContext(extract(name), context);
    alerts.length = 0;
    // No database or signature stubs: reaching either would fail this test.
    await context[name]({});
    assert.equal(alerts.length, 1, name);
    assert.match(alerts[0], /Time In cannot be later/, name);
  }
  assert.match(source, /for \(const record of newRecords\) \{\s+const timeError = truckingTimeOrderError\(record.start_time, record.end_time\);\s+if \(timeError\) throw new Error/);
  console.log('PASS: reversed times, seconds, midnight, valid/equal/optional times, five save paths blocked before writes, and upload guard.');
})().catch(error => { console.error(error); process.exitCode = 1; });
