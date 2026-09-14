const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
const context = vm.createContext({productMeta:{},canonicalPartyName:x=>String(x||'').trim(),normalizeGlRow:x=>x,subledgerAccountMatches:(a,b)=>a===b,roundCurrency:x=>Math.round(x*100)/100,agingBucketRow:(r)=>r});
for(const name of ['agingDocumentGlRows','reconcileAgingDocumentBalances']) {
 const start=source.indexOf('function '+name+'('), end=source.indexOf('\nfunction ',start+1);
 vm.runInContext(source.slice(start,end),context);
}
const invoice={name:'Vendor A',invoice_no:'INV-1',reference:'PO-1',invoice_amount:100,balance:100};
const charge={vendor:'Vendor A',invoice_no:'INV-1',reference:'PO-1',account:'Accounts Payable',posting_date:'2026-08-01',credit:100,debit:0};
const paid={...charge,reference:'CHK-1',posting_date:'2026-09-01',credit:0,debit:100};
const reconcile=(gl,rows=[invoice],date='2026-09-14')=>context.reconcileAgingDocumentBalances(rows,gl,'ap',date);
assert.equal(reconcile([charge,paid]).length,0);
assert.equal(context.productMeta.agingSettlementDetails.ap.length,1);
assert.equal(reconcile([charge,paid],undefined,'2026-08-31')[0].balance,100);
assert.equal(reconcile([charge,{...paid,debit:40}])[0].balance,60);
assert.equal(reconcile([charge,{...paid,vendor:'Vendor B'}])[0].balance,100);
assert.equal(reconcile([charge,{...paid,invoice_no:'INV-1, INV-2'}])[0].balance,100);
assert.equal(reconcile([paid])[0].balance,100);
assert.equal(reconcile([charge,paid,{...paid,reference:'CHK-1-VOID',debit:0,credit:100}])[0].balance,100);
assert.equal(reconcile([charge,paid],[invoice,{...invoice,reference:'PO-2'}]).length,2);
assert.ok(!source.slice(source.indexOf('function arAgingDetailRows'),source.indexOf('function clearAgingCreditsByParty')).includes('rows.push(...subledgerPartyDifferenceRows'));
assert.match(source,/rows.filter\(hasControlPosting\)/);
assert.match(source,/customer deposit\/i.test\(row.type/);
console.log('PASS: exact-document clearing, partial settlements, historical cutoff, wrong parties, batch ambiguity, missing charge, reversal, duplicate invoices, separate control details.');
