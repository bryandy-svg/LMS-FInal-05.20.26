const assert=require('node:assert/strict'),vm=require('node:vm');
const {source,functions}=require('../source.cjs');
const c=vm.createContext({});vm.runInContext(functions(['repairLocationMergeOptions']),c);
const rows=[{jobsite_location:' Job A ',actual_location:'Yard'},{jobsite_location:'Job B',actual_location:'Old'},{jobsite_location:'',actual_location:null}];
const opts=c.repairLocationMergeOptions(rows,'actual_location',[{name:'Depot'},{name:'Old'}],[{old_key:'old'}]);
assert.deepEqual(Array.from(opts.sources),['Yard']);assert.deepEqual(Array.from(opts.targets),['Depot','Job A','Job B','Yard']);
assert.deepEqual(Array.from(c.repairLocationMergeOptions(rows,'jobsite_location',[],[]).sources),['Job A','Job B']);
assert.match(source,/data-repair-location-merge=/);assert.match(source,/mergeButton.dataset.repairLocationMerge, workOrders, mergeButton/);
(async()=>{
 const calls=[],alerts=[];let confirms=false,reloads=0,owner=true;
 const context=vm.createContext({isBryanOwner:()=>owner,alert:s=>alerts.push(s),confirm:()=>confirms,console,window:{location:{reload:()=>reloads++}},supabase:{rpc:async(name,args)=>{calls.push({name,args});return {data:{records:2,tables:{work_orders:1,asset_locations:1},merged:args.p_confirm}};}}});
 vm.runInContext(functions(['mergeTruckingReportJobsite']),context);
 const button={textContent:'Consolidate',disabled:false};
 await context.mergeTruckingReportJobsite('Old','New',button);assert.equal(calls.length,1);assert.equal(calls[0].args.p_confirm,false);assert.equal(reloads,0);
 confirms=true;calls.length=0;await context.mergeTruckingReportJobsite('Old','New',button);assert.deepEqual(calls.map(c=>c.args.p_confirm),[false,true]);assert.equal(reloads,1);assert.equal(button.disabled,false);
 owner=false;calls.length=0;await context.mergeTruckingReportJobsite('Old','New',button);assert.equal(calls.length,0);
 console.log('PASS repair consolidation options, retirement filtering, preview/cancel/confirm and owner gate');
})().catch(e=>{console.error(e);process.exitCode=1;});
