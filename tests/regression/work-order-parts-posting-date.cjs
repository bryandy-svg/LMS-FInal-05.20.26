const vm = require('node:vm'), assert = require('node:assert/strict');
const { functions } = require('../source.cjs');
let field = null, alerts = [], closedThrough = '2026-08-31';
const c = { $: () => field, today: () => '2026-10-07', Date,
  loadAccountingCloseDate: async strict => assert.equal(strict, true),
  isLockedAccountingDate: date => date <= closedThrough, getAccountingCloseDate: () => closedThrough,
  alert: message => alerts.push(message), prompt: () => { throw Error('Unexpected date popup'); } };
vm.createContext(c); vm.runInContext(functions(['workOrderPartsPostingDate']), c);
(async () => {
  assert.equal(await c.workOrderPartsPostingDate({}), '2026-10-07');
  assert.equal(await c.workOrderPartsPostingDate({posting_date:'2026-09-30'}), '2026-09-30');
  field = {value:'2026-10-01'};
  assert.equal(await c.workOrderPartsPostingDate({posting_date:'2026-09-30'}), '2026-10-01');
  field = null;
  assert.equal(await c.workOrderPartsPostingDate({posting_date:'2026-08-30'}), '2026-10-07');
  closedThrough = '2026-10-31';
  field = {value:'2026-08-30'};
  assert.equal(await c.workOrderPartsPostingDate({}), '2026-11-01');
  assert.equal(field.value, '2026-11-01');
  closedThrough = '2026-12-31';
  field = null;
  assert.equal(await c.workOrderPartsPostingDate({}), '2027-01-01');
  closedThrough = '2026-08-31';
  for (const posting_date of ['2026-02-30','bad']) assert.equal(await c.workOrderPartsPostingDate({posting_date}), null);
  c.loadAccountingCloseDate = async () => { throw Error('Offline'); };
  assert.equal(await c.workOrderPartsPostingDate({}), null);
  assert.equal(alerts.length, 3);
  console.log('Work-order dates reuse controls without prompts; closed dates advance automatically; invalid dates and unavailable period checks block posting');
})().catch(error => { console.error(error); process.exitCode = 1; });
