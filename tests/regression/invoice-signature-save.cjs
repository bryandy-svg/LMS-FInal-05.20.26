const assert=require('node:assert/strict'),vm=require('node:vm');const {functions,source}=require('../source.cjs');
let stored,fail=false,missing=false;
const c=vm.createContext({documentPdfName:()=> 'Invoice',currentRows:[{invoice_no:'P10117',total:47.88}],supabase:{from:t=>{assert.equal(t,'invoices');return {update(v){stored=v;return this},eq(k,v){assert.equal(k,'invoice_no');assert.equal(v,'P10117');return this},select:async()=>({data:missing?[]:[{id:'id',invoice_no:'P10117'}],error:fail?{message:'Denied'}:null})}}},esc:x=>String(x||''),window:{location:{href:'https://lmsimports.vercel.app'}},URL,formatDisplayDate:x=>x,money:x=>String(x)});
vm.runInContext(functions(['saveInvoiceSignatureDetails','signatureBlockHtml','printableDocumentHtml']),c);
const scriptStart=source.indexOf('function signatureScriptHtml('); const scriptEnd=source.indexOf('\nlet customerEquipmentFormTab',scriptStart); vm.runInContext(source.slice(scriptStart,scriptEnd),c);
(async()=>{
 const values={signature_data_url:'data:image/png;base64,TEST',signature_printed_name:'Customer Name',signature_signed_date:'10/08/2026',internal_signature_data_url:'data:image/png;base64,INTERNAL',internal_signature_name:'Staff',internal_signature_remarks:'Released',total:999,status:'Paid'};
 const request={keyField:'invoice_no',keyValue:'P10117',values};
 assert.equal((await c.saveInvoiceSignatureDetails(request)).ok,true);assert.equal(stored.total,undefined);assert.equal(stored.status,undefined);assert.equal(Object.keys(stored).length,6);
 assert.equal(c.currentRows[0].total,47.88);
 const html=c.printableDocumentHtml({invoiceSignatureRecord:{invoice_no:'P10117',...stored},title:'Customer Invoice'});
 for(const v of ['data-signature-table="invoices"','Customer Name','Staff','Released','data:image/png;base64,TEST','data:image/png;base64,INTERNAL','Save and Update Invoice'])assert.ok(html.includes(v),v);
 fail=true;assert.equal((await c.saveInvoiceSignatureDetails(request)).ok,false);fail=false;missing=true;assert.equal((await c.saveInvoiceSignatureDetails(request)).ok,false);
 assert.match(c.signatureScriptHtml(),/window.parent/);assert.match(c.signatureScriptHtml(),/window.saveDocumentSignatures = saveSignatures/);
 assert.match(source,/invoiceSignatureRecord: inv/);assert.match(source,/invoiceSignatureRecord: invoice/);
 console.log('PASS: invoice-only signature save, financial fields excluded, metadata restoration, error/no-row failures and preview bridge.');
})().catch(e=>{console.error(e);process.exitCode=1});
