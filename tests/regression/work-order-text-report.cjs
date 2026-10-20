const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
const c=vm.createContext({isReversedLabor:r=>r.status==='Reversed',isHelperLabor:r=>r.helper,formatDisplayDate:s=>s});vm.runInContext(functions(['openingMechanicForWorkOrder','currentWorkOrderMechanic','guamDateKey','workOrderWhatsAppText']),c);
const report=c.workOrderWhatsAppText({wo_no:'W100024',customer_po:'PO12',requested_by:'Edwin',jobsite_location:'Site',actual_location:'Shop',asset_tag:'TR1',_draftAsset:{name:'Truck',serial:'VIN1',plate:'123'},_reportEquipment:{make:'Kenworth',model:'T800'},_issues:[{issue:'No Start'}],_labor:[{mechanic:'Joe',clock_in:'2026-10-08T15:00:00Z',work_done:'Fixed starter\nTested'},{mechanic:'Joe',clock_in:'2026-10-07T15:00:00Z',work_done:'Diagnosed'},{mechanic:'Joe',status:'Reversed',work_done:'Ignore'}]});
for(const value of ['W100024','PO12','Edwin','No Start','Truck','VIN1','Kenworth / T800','2026-10-09','Fixed starter\nTested'])assert.ok(report.includes(value),value);
assert.ok(report.indexOf('Diagnosed')<report.indexOf('Fixed starter'));assert.ok(!report.includes('Ignore'));assert.match(c.workOrderWhatsAppText({}),/No work done recorded yet/);
console.log('PASS report fields, equipment, Guam dates, date ordering, multiline notes and reversed-entry exclusion');

const extra=c.workOrderWhatsAppText({_issues:[{issue:'Coolant leaking'},{issue:'Losing power'}],description:'Additional issue: overheating'});for(const text of ['Coolant leaking','Losing power','Additional issue: overheating'])assert.ok(extra.includes(text));
const issueFields={issue:'Losing power',issue_date:'2026-10-12',status:'Open',assigned_mechanic:'Unassigned',work_notes:''};const tr={dataset:{},querySelector(selector){const key=selector.match(/="([^"]+)"/)?.[1];return {value:issueFields[key]||'',checked:false};}};let saved=[];const saveContext=vm.createContext({document:{querySelectorAll:()=>[tr]},today:()=> '2026-10-12',upsertOne:async(table,row)=>{saved.push({...row});return {...row,id:42};}});vm.runInContext(functions(['saveWorkOrderIssueEdits']),saveContext);(async()=>{await saveContext.saveWorkOrderIssueEdits({id:1});await saveContext.saveWorkOrderIssueEdits({id:1});assert.equal(saved[0].issue,'Losing power');assert.equal(saved[0].wo_id,1);assert.equal(saved[1].id,42,'Retry must reuse the saved issue');})().catch(e=>{console.error(e);process.exitCode=1});

assert.match(c.workOrderWhatsAppText({opening_mechanic:'Starting Tech',_labor:[{mechanic:'Later Tech'}]}),/Tech: Starting Tech/);
assert.match(c.workOrderWhatsAppText({notes:'Opened by mechanic: Robert Sierra',_labor:[]}),/Tech: Robert Sierra/);
assert.match(c.workOrderWhatsAppText({_issues:[{assigned_mechanic:'Assigned Tech'}]}),/Tech: Assigned Tech/);

const transferred=c.workOrderWhatsAppText({opening_mechanic:'Original Tech',assigned_mechanic:'New Tech',_labor:[{mechanic:'Original Tech',clock_in:'2026-10-20T00:00:00Z',work_done:'Earlier repair'}]});
assert.match(transferred,/^Tech: New Tech$/m);assert.doesNotMatch(transferred,/^Tech: Original Tech$/m);assert.match(transferred,/Original Tech: Earlier repair/,'Historical work retains the actual mechanic');
assert.match(c.workOrderWhatsAppText({opening_mechanic:'Original Tech',assigned_mechanic:'  '}),/^Tech: Original Tech$/m);
