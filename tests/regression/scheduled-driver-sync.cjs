const assert=require('node:assert/strict');const vm=require('node:vm');const {functions}=require('../source.cjs');
const alerts=[];let result,queries=[],opened=[];
const ctx=vm.createContext({alert:m=>alerts.push(m),readTruckingTicket:async()=>result,openTruckingMoveForm:async n=>opened.push(n),supabase:{from:table=>({select:cols=>({eq:async(key,value)=>{queries.push({table,key,value});return {data:result,error:null};}})})}});
vm.runInContext(functions(['truckingRequestTickets','openScheduledRequestTickets','assignedDriverSnapshotIsCurrent']),ctx);
(async()=>{
 result=[{ticket_no:'T1',status:'Scheduled'},{ticket_no:'T2',status:'Cancelled'},{ticket_no:'T3',status:'Finalized'}];
 const tickets=await ctx.truckingRequestTickets('R1');assert.equal(tickets.length,2);assert.deepEqual(queries,[{table:'trucking_moves',key:'request_no',value:'R1'}]);
 await ctx.openScheduledRequestTickets('R1',tickets);assert.deepEqual(opened,['T1']);
 await ctx.openScheduledRequestTickets('R1',[{status:'Finalized'}]);assert.match(alerts.pop(),/completed/);
 const stale={ticket_no:'T1',status:'Scheduled',equipment_label:'Old truck',service:'Flatbed'};
 result={...stale};assert.equal(await ctx.assignedDriverSnapshotIsCurrent(stale),true);
 result={...stale,equipment_label:'2235CV',service:'Equipment Move'};assert.equal(await ctx.assignedDriverSnapshotIsCurrent(stale),false);assert.match(alerts.pop(),/Dispatch has changed/);
 result=null;assert.equal(await ctx.assignedDriverSnapshotIsCurrent(stale),false);
 // A dispatched request must be rejected before reading form values or performing any write.
 ctx.truckingRequestTickets=async()=>[{ticket_no:'T1'}];vm.runInContext(functions(['saveTruckingRequest']),ctx);await ctx.saveTruckingRequest('R1');assert.match(alerts.pop(),/linked assignment/);
 // The driver task reads the server even when a stale currentRows entry exists.
 let reads=0;ctx.currentRows=[stale];ctx.readTruckingTicket=async()=>{reads++;return {status:'Finalized'};};
 vm.runInContext(functions(['openAssignedDriverTask']),ctx);await ctx.openAssignedDriverTask('T1');assert.equal(reads,1);assert.match(alerts.pop(),/no longer open/);
 console.log('PASS: scoped scheduled assignment routing, immutable completed requests, save guard, fresh driver reads and stale-task protection');
})().catch(e=>{console.error(e);process.exitCode=1;});
