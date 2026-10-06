const vm=require('node:vm'),assert=require('node:assert/strict');const {functions}=require('../source.cjs');
let answers=[],alerts=[],loads=0;
const c={today:()=> '2026-10-06',formatDisplayDate:x=>x,prompt:()=>answers.shift(),alert:x=>alerts.push(x),loadAccountingCloseDate:async strict=>{assert.equal(strict,true);loads++},isLockedAccountingDate:d=>d<='2026-08-31',Date};vm.createContext(c);vm.runInContext(functions(['chooseAccountingPostingDate']),c);
(async()=>{
 answers=['09/30/2026'];assert.equal(await c.chooseAccountingPostingDate('Reverse journal'),'2026-09-30');
 answers=['08/31/2026','02/30/2026','bad','2026-09-30'];assert.equal(await c.chooseAccountingPostingDate('Post'),'2026-09-30');assert.equal(alerts.length,3);
 answers=[null];assert.equal(await c.chooseAccountingPostingDate('Post'),null);
 c.loadAccountingCloseDate=async()=>{throw Error('offline')};answers=['09/30/2026'];assert.equal(await c.chooseAccountingPostingDate('Post'),null);assert.equal(answers.length,1);
 for(const name of ['reverseManualJournal','reversePurchaseOrderApToEdit','reverseCustomerPayment','reverseSalesOrder','voidWorkOrderPart','reverseSelectedGoodsReceiptBatch','reverseGoodsReceipt','mechanicPortalAcceptPart','applyMechanicPartAcceptances'])assert.match(functions([name]),/chooseAccountingPostingDate/);
 // Execute GL cancellation: no database operation may occur.
 let queries=0;c.prompt=()=> 'Duplicate';c.chooseAccountingPostingDate=async()=>null;c.supabase={from:()=>{queries++;throw Error('unexpected write')}};vm.runInContext(functions(['reverseManualJournal']),c);await c.reverseManualJournal('JE-0926045');assert.equal(queries,0);
 assert.match(functions(['reverseGoodsReceiptRecord']),/movement_date: postingDate/);
 assert.match(functions(['postGoodsReceiptReversalLedger']),/posting_date: postingDate/);
 assert.match(functions(['postWorkOrderPartAcceptanceLedger']),/posting_date: postingDate/);
 console.log('Posting-date selection, closed/invalid dates, cancellation and date propagation passed');
})().catch(e=>{console.error(e);process.exitCode=1});
