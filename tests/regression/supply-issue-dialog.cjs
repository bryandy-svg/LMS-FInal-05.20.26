const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions}=require('../source.cjs');
let reads=[],cache,sequence={data:{prefix:'SM-',next_number:5007}};
const products=[{id:'existing'}];
const c=vm.createContext({productMeta:{products},getViewData:async(key,loader)=>{assert.equal(key,'supply-issuance-recipients');return cache ||= await loader();},getAll:async(table,options)=>{reads.push(table);assert.equal(options.strict,true);assert.ok(options.columns);if(table==='mechanics')return [{name:'Active',status:'Active'},{name:'Former',status:'Inactive'}];assert.equal(table,'issuance_employees');return [{name:'Jane'}];},supabase:{from:table=>{assert.equal(table,'app_sequences');return {select:columns=>{assert.equal(columns,'prefix,next_number');return {eq:(key,value)=>{assert.equal(key,'key');assert.equal(value,'stock');return {maybeSingle:async()=>sequence};}};}};}}});
vm.runInContext(functions(['loadSupplyIssueDialogData']),c);
(async()=>{
assert.equal(await c.loadSupplyIssueDialogData(),'SM-5007');
assert.equal(c.productMeta.products,products);
assert.deepEqual(Array.from(c.productMeta.mechanics),['Active']);
assert.deepEqual(Array.from(c.productMeta.issuanceEmployees),['Jane']);
await c.loadSupplyIssueDialogData();assert.deepEqual(reads,['mechanics','issuance_employees']);
sequence={error:new Error('Unavailable')};await assert.rejects(c.loadSupplyIssueDialogData(),/Unavailable/);
sequence={data:null};await assert.rejects(c.loadSupplyIssueDialogData(),/numbering is unavailable/);
const open=functions(['openSupplyIssueModal']);assert.doesNotMatch(open,/getAll\(|nextRefPreview\(/);assert.match(open,/value="employee"/);assert.match(open,/quickCreateIssuanceEmployee\('supplyEmployee'\)/);
const save=functions(['saveSupplyIssueModal']);assert.match(save,/Employee: \$\{record.issued_to\}/);assert.match(save,/sold_to: record.issued_to/);assert.match(save,/Choose a registered employee/);assert.match(save,/deductProductWithMotherComponents/);
console.log('Supplies dialog uses bounded numbering and cached recipients, reuses products, and preserves employee identity and stock validation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
