const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
const c=vm.createContext({productMeta:{transactionReservations:new Map([['part',3],['full',9]])}});vm.runInContext(functions(['transactionAvailableStock']),c);
assert.equal(c.transactionAvailableStock({sku:'PART',qty:5}),2);assert.equal(c.transactionAvailableStock({sku:'full',qty:5}),0);assert.equal(c.transactionAvailableStock({qty:5,available_qty:1}),1);assert.equal(c.transactionAvailableStock({}),0);assert.equal(c.transactionAvailableStock({sku:'PART',qty:5,available_qty:5}),2);
console.log('PASS available stock subtracts reservations, clamps shortages and overrides stale display totals');
