const assert=require('node:assert/strict'),vm=require('node:vm');const {source}=require('../source.cjs');
const start=source.indexOf('function signatureScriptHtml('),end=source.indexOf('\nlet customerEquipmentFormTab',start);
const builder=vm.createContext({});vm.runInContext(source.slice(start,end),builder);
const script=builder.signatureScriptHtml().replace(/^<script>\s*/,'').replace(/\s*<\/script>$/,'');
async function scenario(ok,table,embedded){
 const events=[];const host={savePdfSignatures:async()=>{events.push('save');return {ok,message:'Failed'};}};
 const win={opener:embedded?null:host,parent:embedded?host:null,print:()=>events.push('native-print')};
 if(embedded)win.printSavedInvoice=()=>events.push('preview-print');
 const c=vm.createContext({window:win,document:{querySelectorAll:()=>[],querySelector:()=>({dataset:{signatureTable:table,signatureKeyField:'invoice_no',signatureKeyValue:'P10117'}})},alert:()=>events.push('alert')});
 vm.runInContext(script,c);await win.saveDocumentSignatures(false);return events;
}
(async()=>{
 assert.deepEqual(await scenario(true,'invoices',true),['save','preview-print']);
 assert.deepEqual(await scenario(true,'invoices',false),['save','native-print']);
 assert.deepEqual(await scenario(false,'invoices',true),['save','alert']);
 assert.deepEqual(await scenario(true,'purchase_orders',true),['save','alert']);
 console.log('PASS: save precedes print, iframe and popup printing, failure never prints, PO behavior preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
