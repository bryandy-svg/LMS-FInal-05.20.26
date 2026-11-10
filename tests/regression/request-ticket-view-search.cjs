const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions}=require('../source.cjs');
const calls=[];const modal={style:{}};
const context={moduleListScope:{view:'truckingrequests',query:'driver',relatedSearch:{ids:['LMS-00601']}},printTruckingTicket:async n=>calls.push(['view',n]),openTruckingMoveForm:async n=>calls.push(['edit',n]),$:()=>modal,esc:s=>String(s),modalTitle:{},modalSave:{style:{}},modalBody:{querySelectorAll:()=>[]}};
vm.createContext(context);vm.runInContext(functions(['truckingRowMatchesSearch','truckingRequestMatchesSearch','openScheduledRequestTickets']),context);
(async()=>{
 await context.openScheduledRequestTickets('REQ',[{ticket_no:'DONE',status:'Finalized'}]);assert.deepEqual(calls.pop(),['view','DONE']);
 await context.openScheduledRequestTickets('REQ',[{ticket_no:'OPEN',status:'Dispatched'}]);assert.deepEqual(calls.pop(),['edit','OPEN']);
 await context.openScheduledRequestTickets('REQ',[{ticket_no:'DONE',status:'Completed'},{ticket_no:'OPEN',status:'Dispatched'}]);assert(context.modalBody.innerHTML.includes('View ticket DONE'));assert(context.modalBody.innerHTML.includes('Edit assignment OPEN'));
 assert(context.truckingRequestMatchesSearch({request_no:'LMS-00601'},'driver'));assert(!context.truckingRequestMatchesSearch({request_no:'LMS-00601'},'different'));assert(context.truckingRequestMatchesSearch({po_no:'6025126-196'},'6025126'));
 console.log('Completed ticket viewer, mixed assignments and related-column searches protected.');
})().catch(e=>{console.error(e);process.exit(1)});
