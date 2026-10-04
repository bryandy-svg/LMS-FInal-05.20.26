const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
const start=source.indexOf('async function settlePostedCreditCardInvoice('),end=source.indexOf('\nasync function ',start+1);
let payments=[],bank=780,ar=0,status='',writes=0,fail=false;
const ctx=vm.createContext({supabase:{from(table){return {select(){return this},update(v){status=v.status;return this},eq(){return Promise.resolve({error:fail?new Error('read failed'):null,data:table==='general_ledger'?[{account:'FHB Checking',source:'Sales Order Invoice',status:'Posted',debit:bank,credit:0},{account:'Accounts Receivable (A/R)',status:'Posted',debit:ar,credit:0}]:payments})}}}},upsertOne:async(table,row)=>{assert.equal(table,'customer_payments');payments.push(row);writes++}});
vm.runInContext(source.slice(start,end),ctx);
(async()=>{
const invoice={id:'1',invoice_no:'P1',customer:'C',invoice_date:'2026-09-14'};
await ctx.settlePostedCreditCardInvoice(invoice,780);assert.equal(status,'Paid');assert.equal(writes,1);
await ctx.settlePostedCreditCardInvoice(invoice,780);assert.equal(writes,1);
bank=0;await assert.rejects(ctx.settlePostedCreditCardInvoice(invoice,780),/does not match/);
bank=780;ar=780;await assert.rejects(ctx.settlePostedCreditCardInvoice(invoice,780),/does not match/);
ar=0;payments=[{receipt_no:'PAY-OTHER',amount:780}];await assert.rejects(ctx.settlePostedCreditCardInvoice(invoice,780),/already has payment/);
fail=true;await assert.rejects(ctx.settlePostedCreditCardInvoice(invoice,780),/read failed/);
assert.ok(source.includes('paymentMode === "credit card" && netReceivable > 0'));
console.log('PASS: posted credit-card settlement, repeat call, missing bank posting, open AR, existing payment, read failure.');
})().catch(e=>{console.error(e);process.exitCode=1});
