const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');const c=vm.createContext({});
for(const name of ['salesOrdersForTab','salesOrderFullyShipped','salesOrderDisplayStatus','salesOrderUnbilledShippedQty']){
 const start=source.search(new RegExp('^function '+name+'\\(','m'));let end=start;
 while((end=source.indexOf('\n}',end+1))>=0){try{new vm.Script(source.slice(start,end+2)).runInContext(c);break}catch(e){if(!(e instanceof SyntaxError))throw e}}
}
const order={order_no:'SO-test',status:'Open',order_type:'Backorder',invoice_no:null,_lines:[{qty:5,issued_qty:5,shipped_qty:0,invoiced_qty:0}]};
assert.equal(c.salesOrdersForTab([order],'special').length,1);
assert.equal(c.salesOrdersForTab([order],'issued').length,0);
assert.equal(c.salesOrdersForTab([{...order,order_type:'Stock Order'}],'current').length,1);
assert.equal(c.salesOrderUnbilledShippedQty(order),5);
assert.equal(c.salesOrderDisplayStatus(order),'Open');
assert.equal(c.salesOrderDisplayStatus({...order,status:'Reversed',invoice_no:'OLD'}),'Reversed');
const action=source.slice(source.indexOf('async function reverseSalesOrder('),source.indexOf('async function releaseQuotationFromSalesOrder('));
assert.match(action,/supabase.rpc\("reverse_sales_order_and_reopen"/);
assert.doesNotMatch(action,/releaseQuotationFromSalesOrder|\.from\(/);
console.log('PASS: reopened stock/backorders return to correct tabs, reserved quantity billable, reversed status takes priority, atomic reversal RPC used.');
