const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync('supabase-app/app.js','utf8');
const ctx=vm.createContext({Number,Math,Map,roundCurrency:n=>Math.round(n*100)/100,
  purchaseOrderReceiptKey:()=>'',purchaseOrderLineReceiptKey:()=>'',poLineVendorUnitCost:l=>l.unit_cost,
  invalidateViewReads:()=>{}, today:()=> '2026-09-25'});
for(const name of ['goodsReceiptBaseAmount','goodsReceiptPostingAmounts','assertBalancedLedgerRows','postGoodsReceiptLedger','postGoodsReceiptReversalLedger']) {
  const start=s.search(new RegExp('^(?:async )?function '+name+'\\(','m')); assert.ok(start>=0,name);
  const rest=s.slice(start),end=rest.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(rest.slice(0,end<0?rest.length:end+1),ctx);
}
const receipt=(qty,unit,base)=>({gr_no:'TEST',po_no:'PO',received_qty:qty,unit_cost:unit,base_unit_cost:base});
(async()=>{
  let calls=[];
  ctx.purchaseOrderForReceipt=async()=>({_lines:[{unit_cost:999}]});
  ctx.supabase={rpc:async(name,args)=>{calls.push({name,args});return {error:null};}};
  for(const gr of [receipt(2,55.68,0),receipt(3,20.44,0),receipt(3,1.3333,1.1111),receipt(1,0,0),receipt(4,62.2475,45.8)]) {
    await ctx.postGoodsReceiptLedger([gr]);
    const rows=calls.at(-1).args.p_rows;
    assert.ok(Math.abs(rows.reduce((n,r)=>n+r.debit-r.credit,0))<0.005);
    if(gr.base_unit_cost===0&&gr.unit_cost>0) assert.equal(rows.find(r=>r.account==='Parts Accrual').credit,0);
    if(gr.unit_cost>0) { await ctx.postGoodsReceiptReversalLedger(gr); assert.ok(Math.abs(calls.at(-1).args.p_rows.reduce((n,r)=>n+r.debit-r.credit,0))<0.005); }
  }
  for(const gr of [receipt(1,82.25,205),receipt(4,45.7,45.8),receipt(1,NaN,2),receipt(1,-1,0)]) {
    const before=calls.length;
    await assert.rejects(ctx.postGoodsReceiptLedger([gr]),/inventory cost/);
    assert.equal(calls.length,before,'Invalid costs must not write or delete ledger entries');
  }
  ctx.supabase.rpc=async()=>({error:new Error('Database rejected posting')});
  await assert.rejects(ctx.postGoodsReceiptLedger([receipt(1,20,10)]),/Database rejected/);
  console.log('PASS: zero vendor costs, freight, rounding, reversals, invalid costs, and atomic posting errors.');
})().catch(e=>{console.error(e);process.exitCode=1});
