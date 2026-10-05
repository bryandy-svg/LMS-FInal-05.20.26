const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('supabase-app/app.js','utf8');
function extract(n){const i=code.search(new RegExp('(?:async )?function '+n+'\\('));const r=code.slice(i);return r.slice(0,r.slice(1).search(/\n(?:async )?function /)+1);}
const reads=[],views=[],nodes=new Map();let full=0,closed=0,fail=false,pending=null;
const context=vm.createContext({Date,Promise,console:{info(){},error(){}},currentView:'accounting',accountingTab:'gl',currentCfg:null,tableMap:{accounting:{}},esc:x=>String(x),
 $:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},
 getViewRows:async table=>{reads.push(table);if(fail)throw Error('Network unavailable');if(pending)await pending;return table==='general_ledger'?[{reference:'JE-1',debit:8}]:[{account:'Cash',type:'Asset'}];},
 loadAccountingCloseDate:async()=>{closed++;},renderLoadedAccountingView:data=>views.push(data),renderCompleteAccountingView:async()=>{full++;}
});
vm.runInContext('let accountingLoadRequest = 0;\n'+extract('isLedgerOnlyAccountingTab')+extract('renderAccountingView'),context);
(async()=>{
 for(const tab of ['gl','coa','bs','is']){
  reads.length=0;context.accountingTab=tab;await context.renderAccountingView();
  assert.deepEqual(reads,['general_ledger','chart_of_accounts']);assert.equal(full,0);
  assert.equal(views.at(-1).gl[0].debit,8);assert.equal(views.at(-1)._ledgerOnly,true);
 }
 assert.equal(closed,4,'Period lock remains refreshed');
 context.accountingTab='ap';await context.renderAccountingView();assert.equal(full,1,'Dependent reports must load real data');
 context.accountingTab='gl';fail=true;await context.renderAccountingView();assert.match(nodes.get('accountingTableHost').innerHTML,/Network unavailable/);assert.equal(typeof nodes.get('retryAccountingLoad').onclick,'function');fail=false;
 let release;pending=new Promise(resolve=>release=resolve);const count=views.length;const loading=context.renderAccountingView();context.currentView='products';release();await loading;assert.equal(views.length,count,'Late accounting response cannot overwrite another module');pending=null;
 context.currentView='accounting';context.accountingTab='gl';
 let releaseFirst;pending=new Promise(resolve=>releaseFirst=resolve);const old=context.renderAccountingView();pending=null;await context.renderAccountingView();const latest=views.length;releaseFirst();await old;assert.equal(views.length,latest,'Earlier load cannot overwrite the newer one');
 const render=vm.createContext({accountingTab:'ap',isLedgerOnlyAccountingTab:context.isLedgerOnlyAccountingTab,renderAccountingView:options=>{assert.equal(options.complete,true);full++;}});
 vm.runInContext(extract('renderLoadedAccountingView'),render);render.renderLoadedAccountingView({_ledgerOnly:true});assert.equal(full,2,'Partial ledger cannot render AP with missing data');
 console.log('PASS: initial GL/COA/BS/IS read only two datasets plus period status; no reconciliation waits; AP requests complete data; error/retry and stale-navigation guards.');
})().catch(error=>{console.error(error);process.exitCode=1;});
