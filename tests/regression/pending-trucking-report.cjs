const assert=require('node:assert/strict');const {functions,source}=require('../source.cjs');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
eval(functions(['truckingRequestStatusTab','pendingTruckingRequestRows','pendingTruckingRequestsHtml']));
const requests=[{request_no:'old',needed_date:'2020-01-01',status:'Completed',customer:'Customer',move_description:'<script>notes</script>'},{request_no:'done',status:'Completed'},{request_no:'cancel',status:'Cancelled'},{request_no:'new',status:'Requested'}];
const lines=[{request_no:'old',line_no:1,status:'Completed'},{request_no:'old',line_no:2,status:'Requested',equipment_label:'Crane'},{request_no:'old',line_no:3,status:'Dispatched'},{request_no:'cancel',line_no:1,status:'Requested'}];
const moves=[{request_no:'old',request_line_no:3,status:'Finalized'}];
const rows=pendingTruckingRequestRows(requests,lines,moves);
assert.deepEqual(rows.map(r=>[r.request.request_no,r.line.line_no]),[['old',2],['new',undefined]]);
const html=pendingTruckingRequestsHtml(requests,lines,moves);assert(html.includes('2 requests'));assert(html.includes('Crane'));assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>'));assert(html.includes('2020-01-01'));assert(html.includes('table-layout:fixed'));assert(html.includes('No pending move requests')===false);assert(pendingTruckingRequestsHtml([]).includes('No pending move requests'));
assert(source.includes('pendingRequests: productMeta.truckingRequests || []'));assert(source.includes('value="pending_requests"'));assert(source.includes('Letter landscape'));
console.log('Pending request lifecycle, partial completion, old backlog and escaping verified.');

const scopeRequests=[{request_no:'UNSCHED',status:'Requested'},{request_no:'SCHED',status:'Scheduled'},{request_no:'DISPATCH',status:'Dispatched'},{request_no:'LINKED',status:'Requested'}];
const scopeMoves=[{request_no:'LINKED',ticket_no:'ticket',status:'Scheduled'}];
const unscheduled=pendingTruckingRequestsHtml(scopeRequests,[],scopeMoves,true);
assert(unscheduled.includes('Unscheduled Move Requests'));assert(unscheduled.includes('1 requests'));assert(unscheduled.includes('UNSCHED'));assert(!unscheduled.includes('DISPATCH'));assert(!unscheduled.includes('LINKED'));
assert(pendingTruckingRequestsHtml(scopeRequests,[],scopeMoves).includes('4 requests'));
assert(pendingTruckingRequestsHtml([],[],[],true).includes('No unscheduled move requests.'));
assert(source.includes('value="unscheduled_requests"'));
