const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const s=fs.readFileSync('supabase-app/app.js','utf8');
const start=s.indexOf('async function acceptReceivedWorkOrderParts('),end=s.indexOf('\n}',start)+2;
let calls=[],fail=true,closed=0;const button={};
const ctx=vm.createContext({supabase:{rpc:async(name,args)=>{calls.push({name,args});return {error:fail?{message:'test failure'}:null,data:[]}}},invalidateViewReads:()=>{},productMeta:{products:[{qty:4}]},$:()=>button,alert:()=>{},closeModal:()=>closed++,renderPurchasingView:async()=>{}});
vm.runInContext(s.slice(start,end),ctx);
(async()=>{
 assert.equal(await ctx.acceptReceivedWorkOrderParts({id:'po'},[{gr_no:'GR-1'}]),false);
 assert.equal(button.textContent,'Retry WO acceptance');fail=false;await button.onclick();
 assert.equal(closed,1);assert.equal(calls.length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{name:'accept_work_order_receipts',args:{p_po_id:'po',p_gr_nos:['GR-1']}});
 assert.deepEqual(calls[0],calls[1]);assert.equal(ctx.productMeta.products.length,0);
 assert(s.indexOf('await postGoodsReceiptLedger(receiptRows)')<s.indexOf('!await acceptReceivedWorkOrderParts(po, receiptRows)'));
 console.log('PASS receipt acceptance RPC, failure recovery retries acceptance only, cache refresh, receipt-ledger ordering');
})().catch(e=>{console.error(e);process.exitCode=1});
