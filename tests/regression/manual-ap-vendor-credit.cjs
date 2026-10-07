const assert = require('node:assert/strict');
const vm = require('node:vm');
const { functions } = require('../source.cjs');
const alerts = [], saved = [];
let header = {posting_date:'2026-10-08',invoice_date:'2026-09-30',reference:'JE-CREDIT',description:'Vendor credit',vendor:'Vendor A'};
let lines = [{account:'Accounts Payable (A/P)',debit:100,credit:0},{account:'Expense',debit:0,credit:100}];
let locked = false;
const c = vm.createContext({
  productMeta:{accountingVendors:[{name:'Vendor A'}]},
  collectProductModalFields:()=>header,readBalancedJournalLines:()=>lines,
  $:()=>null,document:{querySelector:()=>null},alert:m=>alerts.push(m),
  isLockedAccountingDate:()=>locked,journalAccountOptions:()=>['Accounts Payable (A/P)','Expense'],
  assertBalancedLedgerRows:rows=>assert.equal(rows.reduce((s,r)=>s+r.debit-r.credit,0),0),
  getAll:async()=>[],upsertManyWithOptionalColumns:async(table,rows)=>{assert.equal(table,'general_ledger');saved.push(...rows);},
  writeAuditLog:async()=>{},closeModal:()=>{},renderAccountingView:async()=>{},
  roundCurrency:x=>Math.round(x*100)/100,canonicalPartyName:x=>String(x||'').trim(),
  saveAgingControlReview:(_type,review)=>{c.review=review;},
  esc:x=>String(x||''),normalizeCheckRunDocumentKey:x=>String(x||'').toLowerCase(),
  checkRunPaymentForApRow:()=>null,assignedCheckRunDocumentKeys:()=>({poNumbers:new Set(),vendorInvoices:new Set()}),poSupportDetails:()=>({})
});
vm.runInContext(functions(['saveBalancedJournalModal','subledgerAccountMatches','normalizeGlRow','accountsPayableRows','accountsPayableRowsForTab','apRowActions','checkRunEligiblePayables','apAgingDetailRows','accountsPayableGlBalance','agingBucketRow','daysBetween','agingDocumentGlRows','reconcileAgingDocumentBalances','clearAgingCreditsByParty']),c);
(async()=>{
  await c.saveBalancedJournalModal();
  assert.deepEqual(alerts,[]);assert.equal(saved.length,2);
  assert.equal(saved[0].debit,100);assert.equal(saved[0].vendor,'Vendor A');
  assert.equal(saved[0].invoice_no,'JE-CREDIT');assert.equal(saved[0].posting_date,'2026-10-08');
  header={...header,vendor:''};await c.saveBalancedJournalModal();assert.match(alerts.pop(),/Vendor Master/);header.vendor='Vendor A';
  locked=true;await c.saveBalancedJournalModal();assert.match(alerts.pop(),/closed accounting period/);locked=false;
  const data={pos:[],allGl:saved,checkRuns:[]};
  const credit=c.accountsPayableRows(data)[0];
  assert.equal(credit.balance,-100);assert.equal(credit.status,'Unapplied Vendor Credit');assert.equal(credit.paid,false);
  assert.equal(c.accountsPayableRowsForTab([credit],'posted').length,1);
  assert.equal(c.accountsPayableRowsForTab([credit],'forcheck').length,0);
  assert.equal(c.checkRunEligiblePayables(data).length,0);
  assert.doesNotMatch(c.apRowActions(credit),/data-ap-check=|data-ap-writeoff=/);
  const payable={...saved[0],reference:'JE-BILL',invoice_no:'JE-BILL',debit:0,credit:500};
  const gl=[...saved,payable];
  let aging=c.apAgingDetailRows('2026-10-08',{gl});
  assert.equal(aging.length,2);assert.equal(aging.find(r=>r.reference==='JE-BILL').balance,500,'Unapplied credit must not clear an invoice');
  assert.equal(aging.reduce((s,r)=>s+r.balance,0),400);assert.equal(c.review.difference,0);
  assert.equal(c.apAgingDetailRows('2026-10-07',{gl}).length,0,'Posting date, not invoice date, controls inclusion');
  const reversed=saved.map(r=>({...r,status:'Reversed'}));
  const reversal=saved.map(r=>({...r,reference:'REV-JE-CREDIT',invoice_no:null,source:'Manual Journal Reversal',posting_date:'2026-10-09',debit:r.credit,credit:r.debit}));
  const history=[...reversed,...reversal,payable];
  aging=c.apAgingDetailRows('2026-10-08',{gl:history});assert.equal(aging.reduce((s,r)=>s+r.balance,0),400);assert.equal(c.review.difference,0);
  aging=c.apAgingDetailRows('2026-10-09',{gl:history});assert.equal(aging.length,1);assert.equal(aging[0].balance,500);assert.equal(c.review.difference,0);
  assert.equal(c.accountsPayableRows({pos:[],allGl:[...reversed,...reversal]}).length,0,'Reversal must not create a payable');
  assert.equal(saved.length,2,'Rejected saves must not write');
  console.log('PASS: AP debit save, vendor/date guards, unapplied credit visibility, no checks, separate aging, GL reconciliation and dated reversal.');
})().catch(e=>{console.error(e);process.exitCode=1;});
