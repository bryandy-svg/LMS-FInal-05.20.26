const assert=require('node:assert/strict');
const vm=require('node:vm');
const {functions}=require('../source.cjs');
const ctx={isCustomerPurchaseOrder:p=>p.purchase_purpose==='Customer Order',purchaseOrderLineDestinationQty:(p,l)=>Number(l.destination_qty??l.qty)};
vm.createContext(ctx);vm.runInContext(functions(['customerPoStockRedirections','customerReceiptReservationPlan','savePurchaseOrderLines']),ctx);
const po={purchase_purpose:'Customer Order',linked_sales_order_no:'SO-test',_lines:[{sku:'A',qty:3,destination_qty:3},{sku:'B',qty:1,destination_qty:1}]};
assert.equal(ctx.customerPoStockRedirections(po,[{sku:'A',destination_qty:0},{sku:'B',destination_qty:1}])[0].qty,3);
assert.equal(ctx.customerPoStockRedirections(po,[{sku:'A',destination_qty:2},{sku:'B',destination_qty:1}])[0].qty,1);
assert.equal(ctx.customerPoStockRedirections({...po,_lines:[{sku:'A',qty:3,destination_qty:0}]},[{sku:'A',destination_qty:0}]).length,0);
const lines=[{sku:'A',qty:5,issued_qty:1,shipped_qty:0}];
assert.equal(ctx.customerReceiptReservationPlan(lines,[{sku:'A',available:10}],[{sku:'A',destination_received_qty:0}])[0].issued_qty,1);
assert.equal(ctx.customerReceiptReservationPlan(lines,[{sku:'A',available:10}],[{sku:'A',destination_received_qty:2}])[0].issued_qty,3);
assert.equal(ctx.customerReceiptReservationPlan([...lines,...lines],[{sku:'A',available:10}],[{sku:'A',destination_received_qty:2}]).reduce((n,r)=>n+r.issued_qty,0),4);
(async()=>{
let called=0;ctx.supabase={rpc:async(name,args)=>{called++;assert.equal(name,'save_customer_po_allocations');assert.equal(args.p_lines[0].destination_qty,0);return {error:null};}};
await ctx.savePurchaseOrderLines('po',[{id:'line',sku:'A',qty:3,destination_qty:0}],po._lines,po);assert.equal(called,1);
ctx.supabase.rpc=async()=>({error:new Error('stale')});await assert.rejects(()=>ctx.savePurchaseOrderLines('po',[],[],po),/stale/);
console.log('Customer PO stock redirection and receipt allocation checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
