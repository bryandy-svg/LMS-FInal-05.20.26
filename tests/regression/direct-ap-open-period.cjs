const assert=require('node:assert/strict');const vm=require('node:vm');const {functions}=require('../source.cjs');
(async()=>{
const alerts=[];const answers=['09/01/2026','10/01/2026'];let suggested;
const ctx={isLockedAccountingDate:d=>d<='2026-09-30',getAccountingCloseDate:()=> '2026-09-30',loadAccountingCloseDate:async()=>{},formatDisplayDate:d=>d,today:()=> '2026-10-26',prompt:(label,value)=>{suggested??=value;return answers.shift()??null},alert:m=>alerts.push(m),journalReferenceIsListed:(a,b)=>a===b,loadBalancedJournalPaymentChecks:async()=>[[],[],[],[]]};
vm.createContext(ctx);vm.runInContext(functions(['balancedJournalEditEligibility','chooseAccountingPostingDate','reverseDirectApToEdit']),ctx);
const group={reference:'J1',posting_date:'2026-08-20',source:'Manual Journal',status:'Posted',lines:[{id:'old'}]};
assert.equal((await ctx.balancedJournalEditEligibility(group)).allowed,false);
assert.equal((await ctx.balancedJournalEditEligibility(group,null,{reversal:true})).allowed,true);
assert.equal((await ctx.balancedJournalEditEligibility(group,[[],[{reference:'J1',status:'Posted'}],[],[]],{reversal:true})).allowed,false);
assert.equal((await ctx.balancedJournalEditEligibility({...group,status:'Reversed'},null,{reversal:true})).allowed,false);
assert.equal(await ctx.chooseAccountingPostingDate('Reverse',group.posting_date),'2026-10-01');assert.equal(suggested,'2026-10-01');assert.equal(alerts.length,1);
ctx.accountsPayableRows=()=>[];ctx.manualJournalHistoryGroups=()=>[group];ctx.reverseManualJournal=async(ref,options)=>{assert.equal(options.defaultDate,'2026-08-20');assert.equal(options.returnDate,true);return '2026-10-01'};let prefill;ctx.openBalancedJournalModal=async(d,g,p)=>{prefill=p};await ctx.reverseDirectApToEdit({allGl:[group]},'J1');assert.equal(prefill.posting_date,'2026-10-01');assert.equal(prefill.lines[0].entry_date,'2026-10-01');assert.equal(group.posting_date,'2026-08-20');console.log('Direct AP open-period reversal checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
