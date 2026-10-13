const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions}=require('../source.cjs');
const calls=[];
const c=vm.createContext({supabase:{from(table){const call={table};calls.push(call);return {select(){return this},ilike(column,value){call.column=column;call.value=value;return this},in(column,values){call.column=column;call.values=values;return this},order(){return this},async range(start){call.start=start;if(table==='broken')return {error:new Error('offline')};return {data:table==='large'&&start===0?Array.from({length:500},(_,id)=>({id})):table==='large'?[{id:500}]:[]}}}}}});
vm.runInContext(functions(['salesDeliveryRows','loadSalesDeliveryContext','salesReservationAvailability']),c);
(async()=>{
 assert.equal((await c.salesDeliveryRows('large','sku',['ABC','ABC'])).length,501);
 assert.equal(calls.length,2,'Deduplicate SKUs and fetch every page');
 calls.length=0;await c.salesDeliveryRows('products','sku',['A_%']);assert.equal(calls[0].value,'A\\_\\%');
 calls.length=0;await c.salesDeliveryRows('products','id',[]);assert.equal(calls.length,0);
 await assert.rejects(c.salesDeliveryRows('broken','sku',['A']),/offline/);
 const context={products:[{sku:'NAPA46',qty:4}],orders:[{id:'own',order_no:'SO-1149'},{id:'other',order_no:'SO-1036',status:'Reserved'},{id:'void',status:'Void'}],savedLines:[{order_id:'own',sku:'NAPA46',issued_qty:2},{order_id:'other',sku:'napa46',issued_qty:3,shipped_qty:1},{order_id:'void',sku:'NAPA46',issued_qty:9}]};
 const rows=await c.salesReservationAvailability('SO-1149',[{sku:'napa46'}],context);
 assert.equal(rows[0].reservedElsewhere,2);assert.equal(rows[0].available,2);
 console.log('PASS scoped delivery reads paginate, escape SKU wildcards, fail closed, and preserve reservations');
})().catch(error=>{console.error(error);process.exitCode=1});
