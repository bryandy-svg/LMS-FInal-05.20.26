const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
const inactive={name:'Napa Auto Parts',reference:'V-1001',notes:'Inactive as of 8/11/2026 by Bryan.dy'};
const active={name:'NAPA AUTO PARTS',reference:'V-UP-800095-1',notes:null};
const c=vm.createContext({partyMasterMeta:{vendors:[inactive,active]},canonicalPartyName:x=>x,normalizedMasterName:x=>x.toLowerCase(),getAll:async()=>[inactive,active],alert:()=>{}});
vm.runInContext(functions(['activeVendorMasterRows','partySuggestOptions','vendorSuggestOptions','requirePartyMasterSelection']),c);
(async()=>{assert.deepEqual(Array.from(c.vendorSuggestOptions({value:'napa'})),['NAPA AUTO PARTS']);assert.equal((await c.requirePartyMasterSelection('vendors','Napa Auto Parts')).reference,active.reference);c.getAll=async()=>[inactive];assert.equal(await c.requirePartyMasterSelection('vendors','Napa Auto Parts'),null);assert.equal(c.activeVendorMasterRows([{name:'X',status:'Inactive'}]).length,0);console.log('PASS inactive vendor excluded and active duplicate selected');})().catch(e=>{console.error(e);process.exitCode=1});
