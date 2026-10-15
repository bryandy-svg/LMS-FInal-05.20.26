const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
const c=vm.createContext({esc:v=>String(v??''),formatDisplayDate:v=>v});vm.runInContext(functions(['truckingSimpleTable','applyReportMultiFilters']),c);
const html=c.truckingSimpleTable([{jobsite:'A'},{jobsite:'B'}],['jobsite'],{wrapClass:'repair-report-table'});assert.match(html,/report-multi-filter/);assert.match(html,/value="A" checked/);assert.match(html,/value="B" checked/);
function filter(col,values){const boxes=values.map(([value,checked])=>({value,checked}));const summary={},all={};return {dataset:{columnIndex:col},querySelectorAll:()=>boxes,querySelector:s=>s==='summary'?summary:all,boxes,summary,all};}
const sites=filter(0,[['A',true],['B',true],['C',false]]),priorities=filter(1,[['High',true],['Low',false]]);
const heading={dataset:{truckingGroupRow:'true'}};const row=(a,b)=>({dataset:{},children:[{dataset:{filterValue:a}},{dataset:{filterValue:b}}]});const rows=[heading,row('A','High'),row('B','High'),row('C','High'),row('A','Low')];
const wrap={querySelectorAll:s=>s==='.report-multi-filter'?[sites,priorities]:rows};c.applyReportMultiFilters({closest:()=>wrap});assert.deepEqual(rows.map(r=>r.hidden),[false,false,false,true,true]);assert.equal(sites.summary.textContent,'2 selected');
sites.boxes.forEach(b=>b.checked=false);c.applyReportMultiFilters({closest:()=>wrap});assert(rows.every(r=>r.hidden));assert.equal(sites.summary.textContent,'None');
console.log('PASS multiple values per column, combined columns, no selections and empty groups');

const {source}=require('../source.cjs');const exportsBlock=source.slice(source.indexOf('  Object.assign(window, {'),source.indexOf('async function refreshFuelListBalances'));
for(const name of ['positionReportMultiFilter','searchReportMultiFilter','toggleReportMultiFilterAll','applyReportMultiFilters']) assert(exportsBlock.includes(name+','),name+' must be available to inline event handlers');
