const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions,source}=require('../source.cjs');
const c=vm.createContext({});vm.runInContext(functions(['apWorkOrderJobsite']),c);
assert.equal(c.apWorkOrderJobsite({wo_no:'W100079',jobsite_location:'Quarry',actual_location:'Shop'}),'Quarry');
assert.equal(c.apWorkOrderJobsite({jobsite:'Housing'}),'Housing');
assert.equal(c.apWorkOrderJobsite({actual_location:'Shop'}),'');
assert.ok(source.includes('if (!readOnly && !workOrderInput.value.includes(",")) fillWorkOrderSupport();'));
assert.ok(source.includes("openPostApFromPoModal(data, poNo, invoiceNo, receiptGroupKey, true)"));
console.log('PASS AP initial work-order jobsite, no actual-location substitution, and posted-view preservation');
