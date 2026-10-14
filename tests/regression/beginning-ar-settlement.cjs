const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions}=require('../source.cjs');
let invoice={id:'1',invoice_no:'P03412',customer:'PFM',status:'Open',type:'Beginning AR',invoice_date:'2025-10-28',invoice_lines:[{qty:1,rate:1661.44}]},ledger=[],payments=[];
const c=vm.createContext({supabase:{from:table=>({select(){return this},async in(){return {data:table==='invoices'?[invoice]:ledger}}})},salesDeliveryRows:async()=>payments,canonicalPartyName:x=>x,subledgerAccountMatches:()=>true,roundCurrency:x=>Math.round(x*100)/100,money:String});
vm.runInContext(functions(['validateArSettlementAllocations']),c);
const check=(amount,date='2026-10-09')=>c.validateArSettlementAllocations([{row:{invoice_no:'P03412',customer:'PFM'},amount}],date);
(async()=>{
 await check(1661.44);await assert.rejects(check(1661.45),/only/);await assert.rejects(check(1,'2025-01-01'),/only/);
 payments=[{invoice_no:'P03412',amount:100,status:'Posted'}];await assert.rejects(check(1661.44),/only/);await check(1561.44);
 ledger=[{id:'g',invoice_no:'P03412',customer:'PFM',account:'AR',debit:0,credit:100,posting_date:'2026-10-01'}];await check(1561.44);
 payments[0].status='Void';ledger=[];await check(1661.44);
 invoice.type='Sales';await assert.rejects(check(1),/only/);
 console.log('PASS imported AR supports collection without duplicate GL; prior payments, dates, limits and ordinary AR remain guarded');
})().catch(e=>{console.error(e);process.exitCode=1});
