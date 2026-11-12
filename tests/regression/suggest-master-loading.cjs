const assert=require('node:assert/strict'), vm=require('node:vm');
const {functions}=require('../source.cjs');
let failVendor=true, failLocation=true, customerReads=0, redraws=0;
const ctx=vm.createContext({session:{user:{id:'u1'}},suggestMasterLoads:new Map(),partyMasterMeta:{customers:[],vendors:[{name:'Saved vendor'}]},productMeta:{truckingJobsiteRows:[{name:'Saved route',source:'Location Master'}]},canonicalPartyName:s=>s,refreshSuggestMenu:()=>redraws++});
ctx.getAll=ctx.getPagedViewRows=async (table,options)=>{
 if(table==='customers'){customerReads++;await new Promise(r=>setTimeout(r,5));return [{name:'Landscape Management Systems, Inc.'}];}
 if(table==='vendors'){if(failVendor)throw Error('offline');return [{name:'Vendor'}];}
 if(table==='locations'){if(failLocation)throw Error('offline');return [{name:'Destination'}];}
 if(table==='assets')return [{location:'Origin'}];
 return [{name:'Jobsite'}];
};
vm.runInContext(functions(['loadSuggestMaster','ensurePartyMasterSuggestRows','suggestMasterKind','isTruckingJobsiteSuggestInput','truckingJobsiteSuggestRows','truckingJobsiteSuggestOptions','partySuggestOptions']),ctx);
(async()=>{
 await Promise.all([ctx.ensurePartyMasterSuggestRows(),ctx.loadSuggestMaster('customers')]);
 assert.equal(customerReads,1);assert.equal(ctx.partyMasterMeta.customers.length,1);assert.equal(ctx.partyMasterMeta.vendors[0].name,'Saved vendor');
 assert.equal(ctx.partyMasterMeta.loaded,false);
 assert.equal(ctx.partySuggestOptions({value:'LMS'},ctx.partyMasterMeta.customers)[0],'Landscape Management Systems, Inc.');
 await assert.rejects(ctx.loadSuggestMaster('trucking_jobsites'));
 assert.equal(ctx.truckingJobsiteSuggestOptions({value:'Origin'})[0],'Origin');
 assert.ok(ctx.productMeta.truckingJobsites.includes('Saved route'));
 assert.ok(ctx.suggestMasterLoads.get('u1:trucking_jobsites').error);
 failLocation=false;await ctx.loadSuggestMaster('trucking_jobsites',true);
 assert.equal(ctx.suggestMasterLoads.get('u1:trucking_jobsites').error,'');
 assert.ok(ctx.productMeta.truckingJobsites.includes('Destination'));
 const input={dataset:{suggestList:'truckJobsiteOptions'}};
 assert.equal(ctx.suggestMasterKind(input),'trucking_jobsites');assert.equal(ctx.isTruckingJobsiteSuggestInput(input),true);
 failVendor=false;await ctx.ensurePartyMasterSuggestRows(true);assert.equal(ctx.partyMasterMeta.loaded,true);
 assert.ok(redraws>=5);
})().catch(error=>{console.error(error);process.exitCode=1;});
