const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');const c=vm.createContext({});vm.runInContext(functions(['truckingRequestLineProgress','truckingRequestStatusTab']),c);
const req={request_no:'LMS-00508',status:'Dispatched'};const lines=Array.from({length:10},(_,i)=>({request_no:req.request_no,line_no:i+1,status:'Requested',ticket_no:null}));
lines[0]={...lines[0],ticket_no:'LMS-00508-1',status:'Dispatched'};
let p=c.truckingRequestLineProgress(req,lines);assert.equal(p.remaining_count,9);assert.equal(c.truckingRequestStatusTab(p),'unscheduled');
lines[0].status='Completed';p=c.truckingRequestLineProgress({...req,status:'Completed'},lines);assert.equal(p.status,'Partially Dispatched');assert.equal(p.remaining_count,9);
p=c.truckingRequestLineProgress(req,lines.map(l=>({...l,ticket_no:'T'+l.line_no,status:'Dispatched'})));assert.equal(c.truckingRequestStatusTab(p),'scheduled');
p=c.truckingRequestLineProgress({...req,status:'Cancelled'},lines);assert.equal(c.truckingRequestStatusTab(p),'cancelled');console.log('PASS partial dispatch retains nine pending lines, completion does not hide remainder, all dispatched leaves unscheduled');
