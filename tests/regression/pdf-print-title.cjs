const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
const start=source.indexOf('  root.querySelector("[data-document-preview-print]").onclick = () => {');
const end=source.indexOf('  root.querySelector("[data-document-preview-popout]")',start);
for(const fallback of [false,true]) {
  const button={},document={title:'LMS Imports Supabase System'};
  const expected='W100066 - Customer Name';
  let prints=0;
  const verify=()=>{prints++;assert.equal(document.title,expected);assert.equal(frame.contentDocument.title,expected);};
  const frame={contentDocument:{querySelector:()=>({content:expected})},contentWindow:{focus(){},print(){if(fallback)throw Error('fallback');verify();}}};
  vm.runInNewContext(source.slice(start,end),{root:{querySelector:()=>button},document,frame,documentTitle:expected,nativePrint:verify});
  button.onclick();assert.equal(prints,1);assert.equal(document.title,'LMS Imports Supabase System');
}
const a=source.indexOf('function documentPdfName('),b=source.indexOf('\nfunction ',a+1),ctx={};
vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);
assert.equal(ctx.documentPdfName('W100066','Customer Name',true),'W100066D - Customer Name');
assert.equal(ctx.documentPdfName('W100066','Customer Name',false),'W100066 - Customer Name');
const nameStart=source.indexOf('  const pdfEquipment =');
const nameEnd=source.indexOf('\n  return ',nameStart);
for(const [title,equipment,expected] of [
  ['Work Order','2009 FORD F250','W100066 - Customer Name - 2009 FORD F250'],
  ['Work Order Draft','2009 FORD F250','W100066D - Customer Name - 2009 FORD F250'],
  ['Work Order','','W100066 - Customer Name'],
  ['Customer Invoice','2009 FORD F250','W100066 - Customer Name'],
]) {
  const c={title,meta:[['Equipment',equipment]],number:'W100066',partyName:'Customer Name',documentPdfName:ctx.documentPdfName};
  vm.runInNewContext(source.slice(nameStart,nameEnd)+'\nresult=pdfName;',c);
  assert.equal(c.result,expected);
}
console.log('PASS: print filename, draft suffix, fallback, and app title restoration.');
