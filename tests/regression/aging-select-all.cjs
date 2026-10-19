const assert = require('node:assert/strict');
const vm = require('node:vm');
const { functions } = require('../source.cjs');
const all = { checked: false, disabled: false, indeterminate: false };
const rows = ['Customer A', 'Customer B', 'Customer C'].map(name => ({ hidden: false, style: {}, children: [{textContent:''},{textContent:name}], querySelector:()=>null }));
const boxes = rows.map(row => ({ checked:false, disabled:false, closest:()=>row }));
const input = { dataset:{col:'1'}, value:'', closest:()=>table };
const table = {
 querySelector(selector) { return selector === '[data-aging-select-all]' ? all : selector === 'tbody' ? { querySelectorAll:()=>rows } : null; },
 querySelectorAll(selector) {
  if (selector === '.column-filter') return [input];
  if (selector === '.column-sort') return [];
  return boxes;
 },
 closest:selector=>selector === ".trucking-ticket-multifilter" ? null : {}
};
const ctx = vm.createContext({
 esc:x=>String(x??''), money:x=>String(x), agingCell:()=>'',
 document:{activeElement:null}, selectedExcelFilterValues:()=>[], excelFilterValue:x=>x,
 updateTableState:()=>{},updateExcelFilterButtonStates:()=>{},rememberTransientTableState:()=>{}
});
vm.runInContext(functions(['agingCfg','agingTableHtml','visibleAgingChecks','syncAgingSelectAll','bindAgingSelectAll','applyColumnFilters','enhanceExcelHeaderFilters']),ctx);
assert.match(ctx.agingTableHtml([], 'detail'), /<thead>[\s\S]*data-aging-select-all/);
assert.doesNotMatch(ctx.agingTableHtml([], 'summary'), /data-aging-select-all/);
const root={querySelector:()=>table};ctx.bindAgingSelectAll(root);
all.checked=true;all.onchange();assert.ok(boxes.every(b=>b.checked));
boxes[0].checked=false;boxes[0].onchange();assert.equal(all.indeterminate,true);
input.value='Customer A';ctx.applyColumnFilters({target:input});
assert.equal(all.checked,false);assert.equal(all.indeterminate,false);
all.checked=true;all.onchange();assert.equal(boxes[0].checked,true);
all.checked=false;all.onchange();assert.deepEqual(boxes.map(b=>b.checked),[false,true,true]);
input.value='no matches';ctx.applyColumnFilters({target:input});assert.equal(all.disabled,true);assert.equal(all.checked,false);
input.value='';ctx.applyColumnFilters({target:input});assert.equal(all.disabled,false);assert.equal(all.indeterminate,true);
boxes[2].disabled=true;all.checked=false;all.onchange();assert.deepEqual(boxes.map(b=>b.checked),[false,false,true]);
// Rebinding after a table render must restore the handler and state.
ctx.bindAgingSelectAll(root);assert.equal(all.indeterminate,false);
// Shared header enhancement must never replace a selection checkbox with a filter button.
let overwritten=false;
const header={querySelector:selector=>selector==='input[type="checkbox"]'?all:null,set innerHTML(value){overwritten=true;}};
ctx.document.querySelectorAll=()=>[{querySelectorAll:selector=>selector==='.column-filter'?[{dataset:{col:'0'}}]:[header]}];
ctx.enhanceExcelHeaderFilters();assert.equal(overwritten,false);
console.log('PASS aging select all: header, filter changes, partial/empty state, disabled/hidden rows, rebind, header enhancement');
