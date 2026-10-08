const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
let ledger=[],bank=[];
const c=vm.createContext({poSupportDetails:()=>({}),normalizeGlRow:r=>r,subledgerAccountMatches:(a,b)=>a===b,
 checkRunUsesPrintedCheck:()=>true,loadAccountingCloseDate:async()=>{},validateCheckRunDates:r=>r.posting_date,
 supabase:{from:()=>({select(){return this},eq(){return this},limit:async()=>({data:[]}),delete(){return this},then(resolve){resolve({error:null})}})},
 upsertOneWithOptionalColumns:async(t,r)=>bank.push(r),upsertMany:async(t,r)=>ledger.push(...r)});
vm.runInContext(functions(['accountsPayableRows','checkRunEligiblePayables','assignedCheckRunDocumentKeys','normalizeCheckRunDocumentKey','splitCheckRunDocumentValues','parseCheckRunNotes','checkRunNotesPayload','checkRunPaymentForApRow','groupPayablesByVendor','validateCheckRunNetAmount','postCheckRunLedger']),c);
const base={account:'Accounts Payable',vendor:'Vendor A',source:'Manual Journal',status:'Posted',posting_date:'2026-10-08'};
const data={pos:[],allGl:[{...base,reference:'BILL',invoice_no:'BILL',credit:5000},{...base,reference:'CREDIT',invoice_no:'CREDIT',debit:3825}],checkRuns:[]};
(async()=>{
 const eligible=c.checkRunEligiblePayables(data);assert.equal(eligible.length,2);assert.equal(eligible.find(r=>r.po_no==='CREDIT').amount,-3825);
 const groups=c.groupPayablesByVendor(eligible);assert.equal(groups[0].amount,1175);c.validateCheckRunNetAmount(groups[0].amount);
 for(const amount of [-3825,0,NaN])assert.throws(()=>c.validateCheckRunNetAmount(amount),/net check amount/);
 const notes=c.checkRunNotesPayload('',eligible);assert.equal(c.parseCheckRunNotes(notes).invoices[1].amount,-3825);
 const run={check_run_no:'CHK-TEST',reference:'BILL, CREDIT',invoice_no:'BILL, CREDIT',vendor:'Vendor A',amount:1175,status:'For Printing',notes,payment_date:'2026-10-08',posting_date:'2026-10-08'};
 data.checkRuns=[run];assert.equal(c.checkRunEligiblePayables(data).length,0,'Draft prevents duplicate use');
 assert.equal(c.accountsPayableRows(data).reduce((s,r)=>s+r.balance,0),1175,'Draft does not settle');
 run.status='Printed';assert.equal(c.accountsPayableRows(data).reduce((s,r)=>s+r.balance,0),0,'Final print clears both documents');
 await c.postCheckRunLedger(run);assert.equal(bank[0].amount,-1175);assert.equal(ledger[0].debit,1175);assert.equal(ledger[1].credit,1175);
 await assert.rejects(c.postCheckRunLedger({...run,amount:-1}),/net check amount/);assert.equal(ledger.length,2);
 run.status='Void';assert.equal(c.checkRunEligiblePayables(data).length,2,'Void releases invoice and credit');
 run.status='Printed';run.vendor='Vendor B';assert.equal(c.accountsPayableRows(data).reduce((s,r)=>s+r.balance,0),1175,'Other vendor cannot settle credit');
 console.log('PASS: signed credit selection, net posting, draft exclusion, settlement, void, vendor isolation and nonpositive guards.');
})().catch(e=>{console.error(e);process.exitCode=1});
