const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
class Transfer { constructor(){ this.files=[];this.items={add:file=>this.files.push(file)}; } }
const alerts=[],written=[],events=[];
const context=vm.createContext({ DataTransfer:Transfer,WeakMap,Date,Event:class {constructor(type){this.type=type;}},
  esc:String,dateTimeLocalValue:value=>value,alert:value=>alerts.push(value),prompt:()=>null,
  navigator:{clipboard:{writeText:async text=>written.push(text),readText:async()=> '09/16/2026 04:00 PM'}} });
vm.runInContext('const accumulatedWorkPhotoFiles = new WeakMap();',context);
for(const name of ['accumulateWorkPhotoFiles','parseLaborClipboardTime','laborTimeInputHtml','bindLaborTimeClipboard']){
 const start=source.indexOf(`function ${name}(`);assert.ok(start>=0);const rest=source.slice(start),end=rest.slice(1).search(/\n(?:async )?function /);
 vm.runInContext(rest.slice(0,end+1),context);
}
const photos=Array.from({length:25},(_,i)=>({name:`photo-${i}.jpg`,size:100+i,lastModified:i}));
const input={files:[]};assert.equal(context.accumulateWorkPhotoFiles(input,photos).length,25);
assert.equal(input.files.length,25);assert.equal(context.accumulateWorkPhotoFiles(input,photos).length,25);
assert.equal(context.accumulateWorkPhotoFiles(input,[{name:'another.jpg',size:999,lastModified:999}]).length,26);
for(const [value,expected] of [['2026-09-16 09:00','2026-09-16T09:00'],['09/16/2026 04:00 PM','2026-09-16T16:00'],['9/16/2026 12:00 AM','2026-09-16T00:00'],['09/16/2026 12:00 PM','2026-09-16T12:00'],['2026-09-16T09:00:15','2026-09-16T09:00:15']])assert.equal(context.parseLaborClipboardTime(value),expected);
for(const value of ['02/30/2026 09:00 AM','2026-09-16 25:00','09/16/2026 13:00 PM','bad input'])assert.throws(()=>context.parseLaborClipboardTime(value));
const nodes={};for(const field of ['clock_in','clock_out']){
 nodes[`[data-labor-field="${field}"]`]={value:'2026-09-16T09:00',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},dispatchEvent(event){events.push(event.type);}};
 for(const kind of ['copy','paste','status'])nodes[`[data-labor-time-${kind}="${field}"]`]={};
}
const row={querySelector:selector=>nodes[selector]};context.bindLaborTimeClipboard(row);
(async()=>{
 await nodes['[data-labor-time-copy="clock_in"]'].onclick();assert.equal(written[0],'2026-09-16 09:00');
 await nodes['[data-labor-time-paste="clock_out"]'].onclick();assert.equal(nodes['[data-labor-field="clock_out"]'].value,'2026-09-16T16:00');assert.deepEqual(events,['input','change']);
 const out=nodes['[data-labor-field="clock_out"]'];out.listeners.paste({clipboardData:{getData:()=> 'not a date'},preventDefault(){}});
 assert.equal(out.value,'2026-09-16T16:00');assert.equal(alerts.length,1);
 assert.match(context.laborTimeInputHtml('clock_in','2026-09-16T09:00'),/Copy clock in/);
 assert.ok(!source.includes('const files = [...(input.files || [])].slice(0, 8)'));
 console.log('PASS: 25+ photos retained across batches, deduplication, date/time parsing, copy/paste, hour recalculation events, invalid dates preserved.');
})().catch(error=>{console.error(error);process.exitCode=1;});
