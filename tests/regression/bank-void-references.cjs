const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
const start = source.indexOf('function buildBankStatement(');
const end = source.indexOf('\nfunction bankBookDisplayReference', start);
const context = {
  reconciliationAccountKind: () => 'Bank Statement',
  bankTransactionBank: (row, bank) => row.bank_account === bank,
  bankBookDisplayReference: row => row.reference,
  bankPayeeName: row => row.description,
  bankReconciliationMarkKey: () => '',
  bankReconciliationMarked: (bank, to, row, kind, fallback) => kind === 'bank-only' ? fallback : false,
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const bank = 'FHB Checking';
const gl = [1, 2, 3].flatMap(n => [
  { account: bank, posting_date: '2026-08-17', reference: `CHK-100${n}`, credit: 4458.67, source: 'Check Run' },
  { account: bank, posting_date: '2026-08-17', reference: `CHK-100${n}-VOID`, debit: 4458.67, source: 'Check Run Void' },
]);
const rows = [1, 2, 3].map(n => ({ bank_account: bank, tx_date: '2026-08-17', reference: `CHK-100${n}`, amount: -4458.67 }));
rows.push({ bank_account: bank, tx_date: '2026-08-17', reference: 'bank-alias', matched_reference: 'CHK-1001', amount: -4458.67 });
rows.push({ bank_account: bank, tx_date: '2026-08-17', reference: 'VALID', amount: -4458.67 });
const statement = context.buildBankStatement(gl, rows, bank, '2026-08-01', '2026-08-31', 10000);
assert.equal(statement.otherBankItems.length, 1);
assert.equal(statement.otherBankItems[0].num, 'VALID');
assert.equal(statement.otherBankItemsTotal, -4458.67);
assert.equal(statement.bookEnding, 10000);
assert.equal(statement.checksReleased.length, 0);
console.log('PASS: voided original bank references and matched references excluded; unrelated equal-amount transaction retained.');

const monthly = [
  {account:bank,posting_date:'2026-09-10',reference:'CHK-PRIOR',credit:7500,source:'Check Run',status:'Voided'},
  {account:bank,posting_date:'2026-10-21',reference:'CHK-PRIOR-VOID',debit:7500,source:'Check Run Void'},
];
const report = (from,to) => context.buildBankStatement(monthly,[],bank,from,to,43277.19);
const september = report('2026-09-01','2026-09-30');
const october = report('2026-10-01','2026-10-31');
assert.equal(september.bookEnding,35777.19);
assert.equal(october.bookBeginning,september.bookEnding);
assert.equal(october.otherReceiptsTotal,7500);
assert.equal(october.bookEnding,43277.19);
assert.equal(october.depositsInTransitTotal,0);
assert.equal(report('2026-11-01','2026-11-30').bookBeginning,october.bookEnding);
assert.equal(report('2026-09-01','2026-10-31').bookEnding,43277.19);
assert.equal(report('2026-10-01','2026-10-20').otherReceiptsTotal,0);
monthly[1].debit=7000;
assert.equal(report('2026-09-01','2026-10-31').bookEnding,42777.19,'Unbalanced cancellation must not disappear');
console.log('PASS: cross-month cancellations preserve September closing, October opening, and one dated reversal.');
