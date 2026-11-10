const assert=require('node:assert/strict');
const vm=require('node:vm');
const {functions}=require('../source.cjs');
async function run({count=12650,cap=1000,summaryRead=true,failAt=-1}={}){
 let requests=0,aliases=0;const rows=Array.from({length:count},(_,id)=>({id,qty:id%5,reorder_point:2}));
 const context={canonicalizePartyFields:r=>r,decorateProductsWithLookupAliases:async r=>{aliases++;return r},pacedReadPage:fn=>fn(),supabase:{from:()=>{let start,end;const q={select:()=>q,order:()=>q,range:(a,b)=>{start=a;end=b;return q},abortSignal:async()=>{requests++;if(start===failAt)throw Error('offline');return {data:rows.slice(start,Math.min(end+1,start+cap))}}};return q}}};
 vm.createContext(context);vm.runInContext(functions(['getAll']),context);
 const result=await context.getAll('products',{columns:'qty,reorder_point',summaryRead,strict:true});assert.equal(result.length,count);assert.deepEqual(Array.from(result,r=>r.id),rows.map(r=>r.id));return {requests,aliases};
}
(async()=>{const normal=await run({summaryRead:false});const summary=await run();assert.equal(summary.aliases,0);assert.equal(normal.aliases,1);assert(summary.requests<normal.requests);await run({cap:200});await run({count:1000});await run({count:0});await assert.rejects(run({failAt:1000}),/offline/);
 const dashboard=functions(['renderDashboard']);assert(dashboard.includes('currentView !== "dashboard"'));assert(dashboard.includes('moduleListScope !== dashboardScope'));assert(dashboard.includes('"movement_date,type,from_warehouse,to_warehouse,qty,unit_fifo_cost"'));
 console.log(`12,650 rows: ${normal.requests} reads -> ${summary.requests}; complete rows, server caps, failure and product search enrichment protected.`);
})().catch(e=>{console.error(e);process.exit(1)});
