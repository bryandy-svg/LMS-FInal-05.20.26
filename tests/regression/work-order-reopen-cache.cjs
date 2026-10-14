const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
let calls=0,now=1000,fail=false;
const c=vm.createContext({Date:{now:()=>now},session:{user:{id:'u'}},productMeta:{},viewWritesInProgress:0,viewReadGeneration:0,viewReadCache:new Map(),moduleListPages:new Map(),sessionWarmAttempted:new Set(),structuredClone,AbortController,setTimeout,clearTimeout,supabase:{rpc(){calls++;return {order(){return this},range(){return this},abortSignal(){return Promise.resolve(fail?{error:{message:'offline'}}:{data:[{sku:'PART',reserved_qty:3}]})}}}}});
vm.runInContext(functions(['getViewData','invalidateChangedTable','loadTransactionReservations']),c);
(async()=>{
await Promise.all([c.loadTransactionReservations(),c.loadTransactionReservations()]);assert.equal(calls,1,'Concurrent opens share one request');
await c.loadTransactionReservations();assert.equal(calls,1,'Reopen within 15 seconds reuses reservations');assert.equal(c.productMeta.transactionReservations.get('part'),3);
now+=15001;await c.loadTransactionReservations();assert.equal(calls,2,'Expired totals reload');
c.invalidateChangedTable('sales_order_lines');await c.loadTransactionReservations();assert.equal(calls,3,'Reservation changes invalidate totals');
c.invalidateChangedTable('stock_movements');fail=true;await assert.rejects(c.loadTransactionReservations(),/offline/);fail=false;await c.loadTransactionReservations();assert.equal(calls,5,'Failed loads retry');
console.log('PASS deduplicated reopen loads, bounded freshness, write invalidation and retry');
})().catch(e=>{console.error(e);process.exitCode=1});
