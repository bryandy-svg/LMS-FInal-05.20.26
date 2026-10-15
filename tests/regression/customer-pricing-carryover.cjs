const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
const customer={name:'LMS',parts_markup_percent:40,mechanic_hourly_rate:50};const c=vm.createContext({productMeta:{customerRows:[customer],mechanicsRows:[{name:'Tech',hourly_rate:35}],salesPricingRates:[]},normalizedMasterName:x=>x.toLowerCase(),canonicalPartyName:x=>x,salesInventoryUnitCost:p=>p.cost,document:{getElementById:()=>({value:''}),querySelector:()=>({value:'LMS'})},editing:null});
vm.runInContext(functions(['customerPricingRow','customerPricingValue','currentPricingCustomer','customerPartsSellingPrice','customerMechanicRate','selectedSalesPricingRate','salesPricingRatePrice','workOrderPartSellingPrice','workOrderLaborRate','enteredWorkOrderPartPrice','calculatedWorkOrderPartPrice','repairLaborTotal']),c);
const product={cost:100,selling_price:175};
assert.equal(c.customerPartsSellingPrice(product,'LMS'),140);assert.equal(c.customerMechanicRate('LMS','Tech'),50);assert.equal(c.salesPricingRatePrice(product,c.selectedSalesPricingRate()),140);assert.equal(c.workOrderPartSellingPrice({unit_cost:100},product,'LMS'),140);
customer.parts_markup_percent='';customer.mechanic_hourly_rate=null;assert.equal(c.customerPartsSellingPrice(product,'LMS'),175);assert.equal(c.customerMechanicRate('LMS','Tech'),35);assert.equal(c.selectedSalesPricingRate(),null);
customer.parts_markup_percent=0;customer.mechanic_hourly_rate=0;assert.equal(c.customerPartsSellingPrice(product,'LMS'),100);assert.equal(c.customerMechanicRate('LMS','Tech'),0);
customer.parts_markup_percent=' ';assert.equal(c.customerPricingValue('LMS','parts_markup_percent'),null);
assert.equal(c.customerPartsSellingPrice(product,'Unknown'),175);assert.equal(c.customerMechanicRate('Unknown','Tech'),35);
console.log('PASS customer markup and hourly rate, blank fallback, explicit zero, and sales cost multiplier');

customer.parts_markup_percent=40;customer.mechanic_hourly_rate=50;
assert.equal(c.workOrderPartSellingPrice({unit_cost:100,selling_price:123},product,"LMS"),123);
assert.equal(c.workOrderPartSellingPrice({unit_cost:100,selling_price:0},product,"LMS"),0);
assert.equal(c.workOrderPartSellingPrice({unit_cost:100,markup_percent:20},product,"LMS"),120);
assert.equal(c.enteredWorkOrderPartPrice("123",100,40),123);assert.equal(c.enteredWorkOrderPartPrice("0",100,40),0);assert.equal(c.enteredWorkOrderPartPrice("",100,40),140);
assert.equal(c.workOrderLaborRate({hourly_rate:200,mechanic:"Tech"},"LMS"),200);assert.equal(c.workOrderLaborRate({hourly_rate:0},"LMS"),0);assert.equal(c.workOrderLaborRate({hourly_rate:"",mechanic:"Tech"},"LMS"),50);
c.laborCharge=l=>l.hours*l.hourly_rate;assert.equal(c.repairLaborTotal({bill_to_customer:"LMS",_labor:[{hours:4,hourly_rate:200}]}),800);
