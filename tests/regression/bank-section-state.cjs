const assert=require('node:assert/strict');const vm=require('node:vm');const {functions,source}=require('../source.cjs');
const ctx={};vm.createContext(ctx);vm.runInContext(functions(['captureReconciliationSections','restoreReconciliationSections','initializeCollapsedSections']),ctx);
function detail(key,open){return {dataset:{bankCategory:key},open,id:'',querySelector:()=>({textContent:'7 supporting transactions'}),matches:()=>false,removeAttribute(){this.open=false}}}
let nodes=[detail('Charges',true),detail('Payments',false),detail('Outstanding',true)];
const root={querySelectorAll:selector=>selector.includes('not(')?nodes.filter(n=>!n.dataset.collapseInitialized):nodes};
const states=ctx.captureReconciliationSections(root);
nodes=[detail('New category',false),detail('Outstanding',false),detail('Charges',false),detail('Payments',true)];
ctx.restoreReconciliationSections(root,states);
ctx.initializeCollapsedSections(root); // Mutation observer runs after the synchronous render.
assert.equal(nodes[1].open,true);assert.equal(nodes[2].open,true);assert.equal(nodes[3].open,false);assert.equal(nodes[0].open,false);
// Repeated refreshes preserve both expanded and deliberately collapsed sections.
for(let i=0;i<3;i++){const saved=ctx.captureReconciliationSections(root);nodes=nodes.map(n=>detail(n.dataset.bankCategory,false));ctx.restoreReconciliationSections(root,saved);ctx.initializeCollapsedSections(root);assert.equal(nodes[1].open,true);assert.equal(nodes[3].open,false)}
assert.match(source,/data-bank-category="\$\{esc\(label\)\}"/);
assert.match(source,/restoreReconciliationSections\(\$\('content'\), reportSections\)/);
assert(!functions(['bindBankReconciliationMarks']).includes('setTimeout'),'No delayed restoration may override subsequent user toggles');
console.log('Reconciliation section states survive refresh, reorder and collapse observer');
