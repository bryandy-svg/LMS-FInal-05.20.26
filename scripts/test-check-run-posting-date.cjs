const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
const elements={};const saved=[],ledger=[],banks=[],alerts=[];
const values={check_run_no:'CHK-TEST',payment_date:'2026-08-20',posting_date:'2026-09-15',payment_mode:'ACH',payment_account:'FHB Checking',check_no:''};
const element=id=>elements[id] ||= {style:{},querySelector:selector=>selector.includes('data-check-payable')?{checked:true}:{value:values[selector.match(/data-product-field="([^"]+)"/)?.[1]]||''}};
const chain=()=>({select(){return this},eq(){return this},delete(){return this},update(p){saved.push(p);return this},limit:async()=>({data:[]}),then(resolve){resolve({error:null})}});
const ctx=vm.createContext({Date,Number,console,CSS:{escape:x=>x},$:element,today:()=> '2026-09-15',
 esc:x=>String(x??''),money:x=>String(x),formatDisplayDate:x=>x,badge:x=>x,
 isLockedAccountingDate:d=>d<='2026-08-31',loadAccountingCloseDate:async()=>{},alert:x=>alerts.push(x),
 supabase:{from:chain},upsertMany:async(t,r)=>ledger.push(...r),upsertOneWithOptionalColumns:async(t,r)=>banks.push(r),
 upsertOne:async(t,r)=>saved.push(r),getAll:async()=>[],collectProductModalFields:()=>({...values}),
 checkRunEligiblePayables:d=>d.payables||[],nextRefPreview:async()=> 'CHK-TEST',nextAvailableCheckNumber:()=> '6870',
 paymentAccountOptions:()=>['FHB Checking'],productSelect:()=>'',checkRunPayablesTable:()=>'',partyMasterSuggestSource:()=>'',
 bindCheckRunPayableSelectAll:()=>{},bindCheckRunPaymentFields:()=>{},checkRunUsesPrintedCheck:()=>false,
 isFhbCheckingAccount:()=>true,sequentialCheckNo:()=>'',checkRunNotesPayload:()=>'',summarizeCheckSupport:()=>({}),
 incrementSequence:async()=>{},closeModal:()=>{},renderCheckRunView:async()=>{},checkRunOptionalDisplay:x=>x||'',
});
for(const name of ['productInput','validateCheckRunDates','postCheckRunLedger','openCheckRunModal','openEditCheckRunModal','saveCheckRunModal','groupPayablesByVendor','checkRunHistoryTable']) {
 const start=source.search(new RegExp('^(?:async )?function '+name+'\\(','m'));assert.ok(start>=0,name);
 let end=start;while((end=source.indexOf('\n}',end+1))>=0){try{new vm.Script(source.slice(start,end+2)).runInContext(ctx);break}catch(e){if(!(e instanceof SyntaxError))throw e}}
}
(async()=>{
 const payable={po_no:'PO-TEST',vendor:'Vendor',amount:100};
 await ctx.openCheckRunModal({payables:[payable]});
 assert.match(element('modalBody').innerHTML,/Posting date/);
 assert.match(element('modalBody').innerHTML,/type="date" data-product-field="posting_date"/);
 await ctx.saveCheckRunModal({},[payable]);
 assert.equal(alerts.length,0,alerts.join(','));
 assert.equal(saved[0].posting_date,'2026-09-15');assert.equal(saved[0].payment_date,'2026-08-20');
 await ctx.openEditCheckRunModal({checkRuns:[saved[0]]},'CHK-TEST');
 assert.match(element('modalBody').innerHTML,/data-product-field="posting_date" value="2026-09-15"/);
 values.posting_date='2026-09-16';await element('modalSave').onclick();
 assert.equal(saved.at(-1).posting_date,'2026-09-16');
 await ctx.postCheckRunLedger({...saved[0],amount:100});
 assert.equal(ledger.length,2);assert.ok(ledger.every(r=>r.posting_date==='2026-09-15'&&r.entry_date==='2026-08-20'));
 assert.equal(banks[0].tx_date,'2026-08-20');
 assert.equal(ledger.reduce((n,r)=>n+r.debit-r.credit,0),0);
 const before=ledger.length;
 await assert.rejects(()=>ctx.postCheckRunLedger({...saved[0],posting_date:'2026-08-31'}),/closed accounting/);
 assert.equal(ledger.length,before);
 assert.throws(()=>ctx.validateCheckRunDates({payment_date:'2026-09-15',posting_date:'2026-02-30'}),/valid date/);
 assert.equal(ctx.validateCheckRunDates({payment_date:'2026-09-15'}),'2026-09-15');
 assert.match(ctx.checkRunHistoryTable([saved[0]]),/Posting Date/);
 console.log('PASS: new/edit forms, persistence, separate ledger and check dates, balanced posting, legacy fallback, invalid dates, closed-period protection.');
})().catch(e=>{console.error(e);process.exitCode=1});
