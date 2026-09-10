const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js', 'utf8');
const start = source.indexOf('function journalReferenceIsListed(');
const end = source.indexOf('async function openBalancedJournalHistoryModal(', start);
let reads = 0;
const tables = { customer_payments: [], check_runs: [], invoices: [], bank_transactions: [] };
const context = vm.createContext({
  getAll: async table => { reads++; return tables[table]; },
  isLockedAccountingDate: date => date === 'locked',
});
vm.runInContext(source.slice(start, end), context);
(async () => {
  const snapshot = await context.loadBalancedJournalPaymentChecks();
  const groups = Array.from({ length: 100 }, (_, i) => ({ reference: `JE-${i}`, posting_date: '2026-09-11' }));
  const results = await Promise.all(groups.map(group => context.balancedJournalEditEligibility(group, snapshot)));
  assert.equal(reads, 4, '100 journals should share only four table loads');
  assert.ok(results.every(result => result.allowed));
  tables.customer_payments = [{ invoice_no: 'JE-0', status: 'Posted' }];
  assert.equal((await context.balancedJournalEditEligibility(groups[0])).allowed, false);
  assert.equal(reads, 8, 'Edit/save without a snapshot must reload current payment data');
  assert.equal((await context.balancedJournalEditEligibility({ reference: 'X', posting_date: 'locked' })).allowed, false);
  assert.equal((await context.balancedJournalEditEligibility({ reference: 'X', status: 'Reversed' })).allowed, false);
  assert.equal(reads, 8, 'Closed/reversed journals need no payment reads');
  for (const [table, row] of [
    ['check_runs', { reference: 'JE-1', status: 'Posted' }],
    ['bank_transactions', { invoice_no: 'JE-1', status: 'Posted' }],
    ['invoices', { source_ref: 'JE-1', status: 'Paid' }],
  ]) {
    tables[table] = [row];
    assert.equal((await context.balancedJournalEditEligibility(groups[1])).allowed, false);
    tables[table] = [];
  }
  console.log('PASS: shared history reads, fresh edit/save checks, and payment/period restrictions');
})().catch(error => { console.error(error); process.exitCode = 1; });
