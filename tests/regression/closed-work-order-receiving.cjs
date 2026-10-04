const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const source=fs.readFileSync('supabase-app/app.js','utf8');
function extract(name){const start=source.search(new RegExp(`(?:async )?function ${name}\\(`));assert.ok(start>=0,name);const rest=source.slice(start),end=rest.slice(1).search(/\n(?:async )?function /);return rest.slice(0,end+1);}
const closed={id:'closed',wo_no:'W08732',status:'Invoiced',invoice_no:'W08732'},open={id:'open',wo_no:'W100',status:'Open'};
const po={id:'po',po_no:'PO-7068',purchase_purpose:'Work Order',ap_support_wo_no:closed.wo_no,_lines:[{wo_no:closed.wo_no,product_id:'product',sku:'AF2033',qty:6,destination_qty:6}]};
const parts=[{id:'accepted',wo_id:closed.id,product_id:'product',sku:'AF2033',qty_needed:6,accepted_qty:6,status:'Accepted',notes:'Reserved from PO PO-7068 for W08732'}, {id:'pending',wo_id:closed.id,product_id:'product',sku:'AF2033',qty_needed:1,accepted_qty:0,status:'Reserved',notes:'Reserved from PO PO-7068 for W08732'}];
const writes=[],calls=[];
const context=vm.createContext({crypto:{randomUUID},purchaseOrderLineDestinationQty:(po,line)=>Number(line.destination_qty??line.qty),
 getAll:async table=>table==='work_orders'?[closed,open]:table==='work_order_parts'?parts:[],
 upsertMany:async(table,rows)=>writes.push(...rows),
 ensureWorkOrderAccountingAccounts:async()=>calls.push('accounts'),
 profile:{full_name:'Receiver'},session:null,productMeta:{},
 supabase:{rpc:async()=>{calls.push('issue');return {error:null}},from:()=>({update:record=>({eq:async()=>{writes.push(record);return {error:null}}})})},
 refreshWorkOrderWaitingPartsStatus:async()=>calls.push('status'),
});
for(const name of ['isOpenWorkOrder','canReceiveIntoWorkOrder','canKeepPurchaseWorkOrder','workOrderPartOriginPo','planWorkOrderPoReservations','syncPurchaseOrderWorkOrderReservations','ensureGoodsReceiptWorkOrderReservations','automaticallyIssueGoodsReceiptWorkOrderParts','refreshOpenPartRequestAvailability'])vm.runInContext(extract(name),context);
assert.equal(context.canKeepPurchaseWorkOrder(po,closed),true);
assert.equal(context.canKeepPurchaseWorkOrder(null,closed),false);
assert.equal(context.canKeepPurchaseWorkOrder(po,{wo_no:'W999'}),false);
assert.equal(context.canReceiveIntoWorkOrder(closed),false);
assert.equal(context.canReceiveIntoWorkOrder({...closed,status:'Open'}),false);
assert.equal(context.planWorkOrderPoReservations(po,po._lines,parts,[closed,open]).length,0);
assert.equal(context.planWorkOrderPoReservations(po,[],parts,[closed,open]).length,0,'Do not cancel closed WO reservations');
assert.equal(context.planWorkOrderPoReservations({...po,ap_support_wo_no:open.wo_no},[{...po._lines[0],wo_no:open.wo_no}],parts,[closed,open]).length,1);
(async()=>{
 await context.automaticallyIssueGoodsReceiptWorkOrderParts(po,[{gr_no:'G1',product_id:'product',sku:'AF2033',received_qty:6,destination_received_qty:6}]);
 await context.refreshOpenPartRequestAvailability({id:'product',sku:'AF2033',qty:6,cost:20},6,parts);
 assert.equal(writes.length,0,'Closed work-order parts changed');
 assert.equal(calls.length,0,'Closed work order issued, charged, or refreshed');
 console.log('PASS: existing completed WO reference retained, new closed targets rejected, no reservation/availability/history changes, late receipt not auto-issued.');
})().catch(error=>{console.error(error);process.exitCode=1;});
