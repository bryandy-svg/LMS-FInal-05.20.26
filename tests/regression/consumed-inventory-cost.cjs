const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
function extract(name){const start=source.search(new RegExp(`(?:async )?function ${name}\\(`));assert.ok(start>=0);const rest=source.slice(start),end=rest.slice(1).search(/\n(?:async )?function /);return rest.slice(0,end+1);}
const ctx=vm.createContext({roundCurrency:n=>Math.round(n*100)/100});
for(const f of ['fifoReceiptConsumption','consumedInventoryCostUpdates'])vm.runInContext(extract(f),ctx);
const receipt={gr_no:'GR-1'};
const moves=[
 {id:'a',movement_date:'2026-09-01',qty:2,reference_no:'OPEN',unit_fifo_cost:10},
 {id:'b',movement_date:'2026-09-02',qty:4,reference_no:'SM-GR-1',unit_fifo_cost:20},
 {id:'c',movement_date:'2026-09-03',qty:3,type:'Transfer',from_warehouse:'A',to_warehouse:'B'},
 {id:'d',movement_date:'2026-09-04',qty:-3,unit_fifo_cost:40/3},
 {id:'e',movement_date:'2026-09-05',qty:-2,unit_fifo_cost:20},
];
const used=ctx.fifoReceiptConsumption(receipt,moves);
assert.deepEqual(Array.from(used,x=>[x.movement.id,x.quantity]),[['d',1],['e',2]]);
for(const delta of [42.26,-12.51,0.01]){
 const updates=ctx.consumedInventoryCostUpdates(used,delta);
 const value=updates.reduce((s,x)=>s+x.qty*(x.new_unit_cost-x.old_unit_cost),0);
 assert.ok(Math.abs(value+delta)<1e-8,'Stock cost change must exactly match journal');
}
// Regression: LC-1010 updated accounting but left P10040 at 440.14.
const fix=ctx.consumedInventoryCostUpdates([{movement:{id:'sale',qty:-1,unit_fifo_cost:440.14},quantity:1}],42.26);
assert.equal(Math.round(fix[0].new_unit_cost*100),48240);
assert.ok(source.includes('supabase.rpc("apply_consumed_inventory_cost"'));
console.log('PASS: FIFO allocation, transfers, partial layers, cost increases/decreases, cent allocation, and PO-7061 regression.');
