const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js', 'utf8');
const context = vm.createContext({
  productMeta: {}, sessionStorage: { getItem: () => null },
  today: () => '2026-09-15', money: n => n.toFixed(2),
  roundCurrency: n => Math.round(n * 100) / 100,
  canonicalPartyName: n => String(n || '').trim(),
  normalizeGlRow: r => r, sameMoney: (a,b) => Math.abs(a-b) < .005,
  agingBucketRow: r => r, saveAgingControlReview: () => {},
  trialBalanceRows: () => [], checkRunPaymentForApRow: () => null,
});
for (const name of ['subledgerAccountMatches', 'invoiceTotal', 'invoicePaid',
  'accountsReceivableRows', 'accountsReceivableRowsAsOf', 'accountsPayableRows',
  'agingDocumentGlRows', 'reconcileAgingDocumentBalances', 'clearAgingCreditsByParty',
  'arAgingDetailRows', 'apAgingDetailRows', 'accountsReceivableGlBalance',
  'accountsPayableGlBalance', 'accountingGlBalance', 'stockMovementLedgerValue', 'periodCloseChecks']) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(end < 0 ? rest : rest.slice(0, end + 1), context);
}
const line = (account, reference, debit, credit, posting_date = '2026-08-01') => ({
  account, reference, invoice_no: reference, debit, credit, posting_date,
  customer: 'Customer', vendor: 'Vendor', source: 'Manual Journal', status: 'Posted',
});
const gl = [line('Accounts Receivable','AR1',100,0),
  line('Accounts Receivable','AR1',0,40),
  line('Accounts Payable','AP1',0,100),
  {...line('Accounts Payable','AP1',30,0), source:'Payment'},
  line('Accounts Receivable','AR2',200,0,'2026-09-01'),
  line('Accounts Payable','AP2',0,200,'2026-09-01'),
  line('Parts Accrual','AC1',0,25)];
const data = { reportTo:'2026-08-31', allGl:gl,
  gl:gl.filter(r=>r.posting_date <= '2026-08-31'), pos:[],
  invoices:[{id:'1',invoice_no:'AR1',customer:'Customer',invoice_date:'2026-08-01'},
    {id:'2',invoice_no:'AR2',customer:'Customer',invoice_date:'2026-09-01'}],
  invoiceLines:[{invoice_id:'1',qty:1,rate:100},{invoice_id:'2',qty:1,rate:200}],
  payments:[{invoice_no:'AR1',payment_date:'2026-09-01',amount:60}],
};
const checks = context.periodCloseChecks(data);
const ar = checks.find(r=>r.name==='Accounts Receivable');
const ap = checks.find(r=>r.name==='Accounts Payable');
assert.equal(ar.ok,true); assert.match(ar.detail,/Invoice detail 60.00/);
assert.equal(ap.ok,true); assert.match(ap.detail,/Vendor detail 70.00/);
const missing = {...data, allGl:[...gl,line('Accounts Receivable','MISSING',10,0)]};
assert.equal(context.periodCloseChecks(missing).find(r=>r.name==='Accounts Receivable').ok,false,
  'Unmatched postings must continue blocking close');
assert.equal(data.invoices[0]._paid,undefined,'Reconciliation does not change documents');
// Current Paid status must not remove an August document paid in September.
const originalPayables = context.accountsPayableRows;
const originalPaymentLookup = context.checkRunPaymentForApRow;
context.checkRunPaymentForApRow = (row, runs) => runs.find(run => run.reference === row.po_no);
context.poApSummary = po => ({ invoice_date: po.po_date });
context.accountsPayableRows = ({pos}) => pos.map(po => ({
  ...po, balance: po.payment_status === 'Paid' ? 0 : 100,
  beginning_ap: true, invoice_amount: 100,
}));
const historical = {purchaseOrders:[{po_no:'PO-H',po_date:'2026-08-01',vendor:'Vendor',payment_status:'Paid'}],
  checkRuns:[{reference:'PO-H',payment_date:'2026-09-12'}]};
assert.equal(context.apAgingDetailRows('2026-08-31',historical)[0].balance,100);
assert.equal(context.apAgingDetailRows('2026-09-30',historical).length,0);
assert.equal(historical.purchaseOrders[0].payment_status,'Paid');
context.accountsPayableRows = originalPayables;
context.checkRunPaymentForApRow = originalPaymentLookup;
console.log('PASS: close uses historical documents, partial GL settlements, excludes future activity, separates accrual, and blocks real discrepancies.');
