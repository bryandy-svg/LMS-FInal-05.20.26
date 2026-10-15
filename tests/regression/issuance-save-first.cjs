const assert = require('node:assert/strict');
const vm = require('node:vm');
const { functions } = require('../source.cjs');
(async () => {
 const events=[]; const row={dataset:{},querySelector:()=>({checked:true,value:'PART'})};
 const wo={wo_no:'W1',_parts:[]};
 const context={document:{querySelectorAll:()=>[row]},saveWorkOrderPartEdits:async(w)=>{events.push('saved');row.dataset.partId='p1';w._parts=[{id:'p1',sku:'PART',accepted_qty:1}];},workOrderScopedRows:async()=>{events.push('history');return [];},printSelectedWorkOrderPartsIssuance:(w,ids)=>{events.push('print');assert.deepEqual([...ids],['p1']);}};
 vm.createContext(context);vm.runInContext(functions(['saveAndPrintWorkOrderIssuance']),context);
 await context.saveAndPrintWorkOrderIssuance(wo);assert.deepEqual(events,['saved','history','print']);
 events.length=0;context.saveWorkOrderPartEdits=async()=>{throw Error('Stock unavailable');};
 await assert.rejects(context.saveAndPrintWorkOrderIssuance(wo),/Stock unavailable/);assert.equal(events.length,0);
 context.saveWorkOrderPartEdits=async()=>events.push('saved');context.workOrderScopedRows=async()=>{throw Error('Network');};
 await assert.rejects(context.saveAndPrintWorkOrderIssuance(wo),/Parts were saved/);assert.deepEqual(events,['saved']);
 assert(!functions(['printSelectedWorkOrderPartsIssuance']).includes('querySelector'), 'Print must only use persisted rows');
})().catch(error=>{console.error(error);process.exitCode=1;});
