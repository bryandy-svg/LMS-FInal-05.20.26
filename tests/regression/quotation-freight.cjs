const assert = require('node:assert/strict');
const vm = require('node:vm');
const {functions} = require('../source.cjs');
const quote={id:'q1',quote_no:'QT-1',customer:'Customer',customer_po:'PO1',freight_amount:45.50,_lines:[{sku:'A',qty:2,price:10}]};
let savedOrder, printed;
const context={currentRows:[quote],Number,alert:()=>{},confirm:()=>true,today:()=> '2026-10-09',nextRefPreview:async()=> 'SO-1',hasSalesLineShortage:()=>false,upsertOneWithOptionalColumns:async(table,record)=>{savedOrder=record;return {id:'s1',...record}},supabase:{from:()=>({insert:async()=>({error:null}),update:()=>({eq:async()=>({error:null})})})},incrementSequence:async()=>{},loadView:async()=>{},openSalesReorderPoPrompt:async()=>{},money:value=>Number(value).toFixed(2),printableDocumentHtml:args=>{printed=args;return 'html'},openPrintWindow:()=>{}};
vm.createContext(context);vm.runInContext(functions(['quotationTotal','acceptQuotation','printQuotation']),context);
(async()=>{
 assert.equal(context.quotationTotal(quote),65.50);
 assert.equal(context.quotationTotal({_lines:quote._lines}),20);
 context.printQuotation('QT-1');assert.equal(printed.lines.at(-1)[1],'Freight');assert.equal(printed.total,65.5);
 await context.acceptQuotation('QT-1');assert.equal(savedOrder.freight_amount,45.5);
 assert.doesNotMatch(functions(['openQuotationModal']),/getAll\("products"\)/);
 assert.match(functions(['saveQuotationModal']),/Number.isFinite\(record.freight_amount\)/);
 console.log('Quotation freight carries through totals, PDF and sales-order conversion; no blocking catalog reload');
})().catch(error=>{console.error(error);process.exitCode=1});
