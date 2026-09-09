const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js', 'utf8');
const start = source.indexOf('function buildBankStatement(');
const end = source.indexOf('\nfunction bankBookDisplayReference', start);
const context = {
  reconciliationAccountKind: () => 'Bank Statement',
  bankTransactionBank: (row, bank) => row.bank_account === bank,
  bankBookDisplayReference: row => row.reference,
  bankPayeeName: row => row.description,
  bankReconciliationMarkKey: () => '',
  bankReconciliationMarked: () => false,
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
