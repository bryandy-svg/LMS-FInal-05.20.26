const assert = require('node:assert/strict');
const vm = require('node:vm');
const {functions} = require('../source.cjs');
const notices=[];const context={alert:m=>notices.push(m)};vm.createContext(context);
vm.runInContext(functions(['validateWorkOrderCustomerJobsite']),context);
for(const invalid of [{},{bill_to_customer:'Customer'},{jobsite_location:'Site'},{bill_to_customer:'  ',jobsite_location:'Site'},{bill_to_customer:'Customer',jobsite_location:'\t\n'}]) assert.equal(context.validateWorkOrderCustomerJobsite(invalid),false);
const valid={bill_to_customer:' Customer ',jobsite_location:' Site '};assert.equal(context.validateWorkOrderCustomerJobsite(valid),true);assert.deepEqual(valid,{bill_to_customer:'Customer',jobsite_location:'Site'});
for(const name of ['saveNewWorkOrderModal','saveWorkOrderEditModal']) assert(functions([name]).indexOf('validateWorkOrderCustomerJobsite(record)') < functions([name]).indexOf('await '));
