const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');const c=vm.createContext({checkRunPaymentForApRow:()=>null});vm.runInContext(functions(['accountsPayableRows','normalizeGlRow','subledgerAccountMatches']),c);
const old={reference:'9211623278',vendor:'TVH',account:'Accounts Payable (A/P)',credit:233.23,debit:0,posting_date:'2026-08-20',source:'Manual Journal',status:'Reversed'};
const reversal={...old,reference:'REV-9211623278',source:'Manual Journal Reversal',status:'Posted',posting_date:'2026-09-01',credit:0,debit:233.23};
const corrected={...old,vendor:'JCB INC.',status:'Posted',posting_date:'2026-10-26',description:'JCB'};
for(const gl of [[old,reversal,corrected],[corrected,reversal,old],[reversal,old,corrected]]) {const rows=c.accountsPayableRows({pos:[],allGl:gl});assert.equal(rows.length,1);assert.equal(rows[0].vendor,'JCB INC.');assert.equal(rows[0].po_date,'2026-10-26');assert.equal(rows[0].balance,233.23);assert.equal(rows[0].description,'JCB');}
assert.equal(c.accountsPayableRows({pos:[],allGl:[old,reversal]}).length,0);
const same=c.accountsPayableRows({pos:[],allGl:[old,reversal,{...corrected,vendor:'TVH'}]});assert.equal(same[0].po_date,'2026-10-26');assert.equal(same[0].description,'JCB');
assert.equal(c.accountsPayableRows({pos:[],allGl:[old]})[0].balance,233.23);console.log('Reposted AP vendor and date checks passed');
