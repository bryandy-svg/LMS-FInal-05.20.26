const assert = require('node:assert/strict');
const vm = require('node:vm');
const {functions} = require('../source.cjs');
const notices=[];const context={productMeta:{customerRows:[{name:"Customer"}]},alert:m=>notices.push(m)};vm.createContext(context);
vm.runInContext(functions(['validateSavedCustomer','validateWorkOrderCustomerJobsite']),context);
for(const invalid of [{},{bill_to_customer:'Customer'},{jobsite_location:'Site'},{bill_to_customer:'  ',jobsite_location:'Site'},{bill_to_customer:'Customer',jobsite_location:'\t\n'}]) assert.equal(context.validateWorkOrderCustomerJobsite(invalid),false);
const valid={bill_to_customer:' Customer ',jobsite_location:' Site '};assert.equal(context.validateWorkOrderCustomerJobsite(valid),true);assert.deepEqual(valid,{bill_to_customer:'Customer',jobsite_location:'Site'});
for(const name of ['saveNewWorkOrderModal','saveWorkOrderEditModal']) assert(functions([name]).indexOf('validateWorkOrderCustomerJobsite(record)') < functions([name]).indexOf('await '));

assert.equal(context.validateWorkOrderCustomerJobsite({bill_to_customer:'Invented Customer',jobsite_location:'Site'}),false);
assert.equal(context.validateSavedCustomer({customer:'Customer extra'}),false);
const canonical={customer:' customer '};assert.equal(context.validateSavedCustomer(canonical),true);assert.equal(canonical.customer,'Customer');
context.productMeta.customerRows=[];assert.equal(context.validateSavedCustomer({customer:'Customer'}),false,'Missing master data must fail closed');
for(const name of ['saveQuotationModal','saveSalesOrderModal','saveInvoiceModal']) assert(functions([name]).includes('if (!validateSavedCustomer(record)) return;'));
