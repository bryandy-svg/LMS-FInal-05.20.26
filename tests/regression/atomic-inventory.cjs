const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const src=fs.readFileSync('supabase-app/app.js','utf8');
function fn(name){const i=src.indexOf(`async function ${name}(`);assert(i>=0);return src.slice(i,src.indexOf('\n}',i)+2);}
(async()=>{
 const calls=[];let fail=false;
 const context=vm.createContext({activeReceipts:po=>po._receipts,goodsReceiptBaseAmount:(_,r)=>r.received_qty*r.unit_cost,fifoConsumedQuantityForReceipt:async()=>0,today:()=> '2026-10-01',profile:{full_name:'Test'},session:{},supabase:{rpc:async(name,args)=>{calls.push({name,args});return fail?{error:new Error('transaction failed')}:{data:args.p_changes.map(row=>({...row,unit_cost:row.landed_unit_cost}))};}}});
 vm.runInContext(fn('syncGoodsReceiptInvoiceFromAp')+'\n'+fn('syncAllocatedLandedCostToReceipts'),context);
 const po={_receipts:[{id:'r1',received_qty:2,unit_cost:10,base_unit_cost:10,landed_unit_cost:12}],_lines:[{id:'l1',unit_cost:10}]};
 await context.syncGoodsReceiptInvoiceFromAp(po,{invoice_amount:30,invoice_no:'I1',posting_date:'2026-10-01'},[{id:'r1',po_line_id:'l1',received_qty:2,received_amount:30}]);
 assert.equal(calls.length,1);assert.equal(calls[0].name,'correct_receipts_atomic');assert.equal(calls[0].args.p_changes[0].base_unit_cost,15);assert.equal(calls[0].args.p_changes[0].landed_unit_cost,17);assert.equal(po._receipts[0].unit_cost,17);assert.equal(po._lines[0].unit_cost,15);
 fail=true;const before=JSON.stringify(po);
 await assert.rejects(()=>context.syncGoodsReceiptInvoiceFromAp(po,{invoice_amount:40}),/transaction failed/);assert.equal(JSON.stringify(po),before);
 fail=false;await context.syncAllocatedLandedCostToReceipts(po,8,{posting_date:'2026-10-01'});assert.equal(calls.at(-1).args.p_changes[0].landed_unit_cost,19);
 const acceptance=fn('saveWorkOrderPartEdits');assert(acceptance.includes("rpc('save_work_order_parts_atomic'"));assert(!acceptance.includes('deductProductWithMotherComponents('));assert(!acceptance.includes('upsertManyWithOptionalColumns('));
 for(const name of ['syncGoodsReceiptInvoiceFromAp','syncAllocatedLandedCostToReceipts']){assert(!fn(name).includes('.update('));assert(!fn(name).includes('postConsumedInventoryCostCorrection('));}
 assert(fn('ensureWorkOrderInvoiceCostLedger').includes('Work Order Part Void'));
 console.log('PASS: AP and landed-cost RPC payloads, success-only local updates, error preservation, atomic acceptance wiring, return-aware invoice costing');
})().catch(error=>{console.error(error);process.exitCode=1;});
