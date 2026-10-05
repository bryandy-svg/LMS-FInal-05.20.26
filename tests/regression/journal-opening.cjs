const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
function extract(name) {
  const start = source.search(new RegExp('(?:async )?function ' + name + '\\('));
  const rest = source.slice(start);
  return rest.slice(0, rest.slice(1).search(/\n(?:async )?function /) + 1);
}
const elements = new Map(), fields = new Map(), reads = [], sequence = [];
function node() { return { value:'', dataset:{}, style:{}, listeners:{}, addEventListener(n, fn) {this.listeners[n]=fn;}, setAttribute(){}, removeAttribute(){}, setCustomValidity(){}, reportValidity(){}, before(child){elements.set(child.id, child);}, remove(){}, querySelector(){return node();} }; }
const get = id => { if(!elements.has(id)) elements.set(id,node());return elements.get(id); };
const field = key => {if(!fields.has(key)) fields.set(key,node());return fields.get(key);};
get('modalBody').querySelector = selector => field(selector.match(/="([^"]+)"/)[1]);
field('posting_date').value = '2026-09-22';
field('reference').value = 'JE-0926006';
const document = {getElementById:get,createElement:node,querySelector:selector=>field(selector.match(/="([^"]+)"/)[1]),activeElement:null};
let saves = 0;
const ctx = vm.createContext({ console, Map, Promise, Number, String, Math, document, $:get,
  today:()=> '2026-09-22', productMeta:{}, partyMasterMeta:{customers:[],vendors:[]},
  productInput:()=>'',productSelect:()=>'',esc:x=>x||'',journalLineRowHtml:()=>'',
  journalAccountOptions:rows=>rows.map(x=>x.account),wireBalancedJournalLines:()=>{},
  saveBalancedJournalModal:()=>{saves++;},runExclusiveModalSave:(_,fn)=>fn(),
  quickCreateBalancedJournalJobsite:()=>{},showSuggestMenu:()=>{},
  getAll:()=>{throw Error('Full table loader must not run when opening');},
  loadBalancedJournalLookups:()=>{throw Error('Eager lookups must not run');},
  nextJournalReferencePreview:()=>{throw Error('Full ledger reference scan must not run');},
  getViewRows:async table=>{reads.push(table);return [{name:'Test',wo_no:'WO-1',account:'Cash'}];},
  alert:message=>{throw Error(message);},
  supabase:{from(table){assert.equal(table,'app_sequences');return {select(columns){assert.equal(columns,'next_number');return this;},eq(){return this;},maybeSingle(){return new Promise(resolve=>sequence.push(resolve));}};}}
});
vm.runInContext(extract('journalSequenceParts')+require('../source.cjs').functions(['journalReferenceFromSnapshot','setupNewJournalLoading'])+extract('openBalancedJournalModal'), ctx);
(async()=>{
  const data = {coa:[{account:'Cash'}],allGl:[{reference:'JE-0926005'},{reference:'JE-0826999'}]};
  const opened = ctx.openBalancedJournalModal(data);
  assert.equal(get('modal').style.display,'flex','Form visible before sequence request finishes');
  assert.deepEqual(reads,[],'Opening pulls no master tables');
  assert.equal(sequence.length,1,'Only one small sequence read');
  await opened;
  sequence.shift()({data:{next_number:8}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(field('reference').value,'JE-0926008');
  field('vendor').listeners.focus();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(reads,['vendors']);
  field('vendor').listeners.focus();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(reads,['vendors'],'Repeated focus reuses lookup');
  await get('modalSave').onclick();
  assert.equal(saves,1);
  field('posting_date').value='2026-10-01';field('posting_date').listeners.change();
  field('reference').value='MY-MANUAL-REFERENCE';
  sequence.shift()({data:{next_number:9}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(field('reference').value,'MY-MANUAL-REFERENCE','Late preview cannot overwrite manual input');
  field('reference').value=field('reference').dataset.systemJournalReference;
  field('posting_date').listeners.change();
  const beforeClose = field('reference').value;
  elements.set('journalLineBody',node());
  sequence.shift()({data:{next_number:999}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(field('reference').value,beforeClose,'Closed/replaced form ignores pending reference');
  await get('modalSave').onclick();
  assert.equal(saves,1,'Pending save cannot post a replaced form');
  assert.equal(ctx.journalReferenceFromSnapshot('2026-09-22',data.allGl),'JE-0926006');
  console.log('PASS: form opens before network resolves; no master/ledger reads on open; focused lookups only; lookup reuse; save remains gated; manual reference protected.');
})().catch(error=>{console.error(error);process.exitCode=1;});

