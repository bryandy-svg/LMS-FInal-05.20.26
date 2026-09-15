const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
const posted=[];
const chain={delete(){return this},eq(){return this},then(resolve){resolve({error:null})}};
const c=vm.createContext({roundCurrency:n=>Math.round(n*100)/100,isLockedAccountingDate:()=>false,
 requireSalesAccountingAccounts:async()=>{},productMeta:{products:[{sku:'TEST',cost:0}]},supabase:{from:()=>chain},
 upsertManyWithOptionalColumns:async(t,rows)=>posted.push(...rows),
 assertBalancedLedgerRows:rows=>assert.equal(Math.round(rows.reduce((n,r)=>n+r.debit-r.credit,0)*100),0)});
for(const name of ['salesOrderInvoiceAdjustments','postPartialSalesOrderInvoiceAccounting']) {
 const start=source.search(new RegExp('^(?:async )?function '+name+'\\(','m'));let end=start;
 while((end=source.indexOf('\n}',end+1))>=0){try{new vm.Script(source.slice(start,end+2)).runInContext(c);break}catch(e){if(!(e instanceof SyntaxError))throw e}}
}
const order={order_no:'SO-1031',customer:'NAVY EXCHANGE',freight_amount:125,deposit_amount:1102,payment_mode:'PO'};
const parts=[{billQty:2,price:27.5},{billQty:2,price:15.5},{billQty:2,price:18},{billQty:1,price:855}];
const deposit={source_ref:'SO-1031',type:'Customer Deposit',status:'Paid',_lines:[{description:'Customer deposit',qty:1,rate:1102}]};
const adjust=previous=>c.salesOrderInvoiceAdjustments(order,parts,previous);
assert.equal(adjust([deposit]).freight,125);assert.equal(adjust([deposit]).depositApplied,1102);assert.equal(adjust([deposit]).total,0);
const first={source_ref:'SO-1031',type:'Parts Sales',status:'Open',_lines:[{description:'Freight',qty:1,rate:125},{description:'Less customer deposit REF',qty:1,rate:-600}]};
assert.equal(adjust([first]).freight,0);assert.equal(adjust([first]).depositApplied,502);
assert.equal(adjust([{...first,status:'Reversed'}]).depositApplied,1102);
assert.equal(adjust([{...first,status:'Cancelled'}]).freight,125);
assert.equal(adjust([{...first,source_ref:'OTHER'}]).freight,125);
assert.equal(c.salesOrderInvoiceAdjustments(order,[{billQty:1,price:100}],[deposit]).depositApplied,225);
assert.equal(c.salesOrderInvoiceAdjustments({...order,deposit_amount:0},parts,[deposit]).total,1102);
assert.equal(adjust([{...first,_lines:[{description:'Freight',qty:1,rate:125},{description:'Less customer deposit REF',qty:1,rate:-1102}]}]).depositApplied,0);
(async()=>{
 await c.postPartialSalesOrderInvoiceAccounting(order,{invoice_no:'TEST',invoice_date:'2026-09-15'},parts,adjust([deposit]));
 assert.equal(posted.find(r=>r.account==='Customer Deposit').debit,1102);
 assert.equal(posted.find(r=>r.account==='Parts Sales').credit,1102);
 assert.ok(!posted.some(r=>/Receivable|Checking/.test(r.account)));
 const conversion=source.slice(source.indexOf('async function invoiceSalesOrder('),source.indexOf('async function postPartialSalesOrderInvoiceAccounting('));
 assert.match(conversion,/description: "Freight", qty: 1, rate: freight/);
 assert.match(conversion,/rate: -depositApplied/);
 assert.match(conversion,/\{ freight, depositApplied \}/);
 console.log('PASS: SO-1031 freight/deposit retained, partial deposit carryforward, no duplicate freight/deposit, reversed invoices excluded, balanced fully-deposited invoice posting.');
})().catch(e=>{console.error(e);process.exitCode=1});
