const assert=require('node:assert/strict');const vm=require('node:vm');const {functions,source}=require('../source.cjs');
let queued, notices=[], invalidated=[], rendered=0, writes=[];
const c={session:{user:{id:'staff'}},currentView:'bank',bankRefreshBusy:false,viewWritesInProgress:0,foregroundViewLoads:0,DATABASE_CHANGE_KEY:'change',bankRefreshTimer:null,document:{hidden:false,hasFocus:()=>false,activeElement:null},localStorage:{setItem:(k,v)=>notices.push(JSON.parse(v))},setTimeout:fn=>(queued=fn,1),clearTimeout:()=>{},invalidateChangedTable:t=>invalidated.push(t),renderBankReconciliationView:async()=>rendered++,console:{log:console.log,warn:()=>{}},fetch:async()=>({ok:true}),Math,Date};
vm.createContext(c);vm.runInContext(functions(['bankRelevantChange','notifyCommittedDatabaseWrite','receiveDatabaseChange','scheduleBankReconciliationRefresh','refreshBankReconciliationInBackground','refreshBankOnFocus','appDatabaseFetch']),c);
(async()=>{
 await c.appDatabaseFetch('https://db/rest/v1/general_ledger',{method:'POST'});
 assert.equal(notices.length,1);assert.equal(notices[0].table,'general_ledger');assert.equal(c.viewWritesInProgress,0);
 await queued();assert.equal(rendered,1);
 c.fetch=async()=>({ok:false});await c.appDatabaseFetch('https://db/rest/v1/general_ledger',{method:'POST'});assert.equal(notices.length,1,'Failed writes must not announce committed changes');
 invalidated=[];c.receiveDatabaseChange({key:'change',newValue:JSON.stringify({table:'general_ledger',userId:'other'})});assert.equal(invalidated.length,0);
 c.receiveDatabaseChange({key:'change',newValue:'invalid'});assert.equal(invalidated.length,0);
 c.receiveDatabaseChange({key:'change',newValue:JSON.stringify({table:'general_ledger',userId:'staff'})});assert.deepEqual(invalidated,['general_ledger']);await queued();assert.equal(rendered,2);
 c.document.hasFocus=()=>true;c.document.activeElement={matches:()=>true};await c.refreshBankReconciliationInBackground();assert.equal(rendered,2,'Do not replace fields while typing');
 c.document.hasFocus=()=>false;c.document.hidden=true;await c.refreshBankReconciliationInBackground();assert.equal(rendered,2);
 c.document.hidden=false;c.currentView='products';await c.refreshBankReconciliationInBackground();assert.equal(rendered,2);
 c.currentView='bank';invalidated=[];c.refreshBankOnFocus();assert(invalidated.includes('general_ledger'));
 c.renderBankReconciliationView=async()=>{throw Error('offline')};await c.refreshBankReconciliationInBackground();assert.equal(c.bankRefreshBusy,false);assert.equal(typeof queued,'function');
 assert.match(source,/sequence !== bankRenderSequence/);assert.match(source,/session\?\.user\?\.id !== userId/);
 assert.match(source,/if \(retained\)/);assert.match(source,/el\.value=item\.value/);
 console.log('Bank live collections regression checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});

