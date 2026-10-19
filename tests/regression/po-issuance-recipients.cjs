const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions}=require('../source.cjs');
let names=[],entered='  Jane   Doe  ',inserts=0,fail=false,alerts=[];
const select={isConnected:true};let selectedId;
const c=vm.createContext({productMeta:{},esc:v=>String(v).replaceAll('<','&lt;'),workOrderOptionLabel:()=>'',prompt:()=>entered,alert:m=>alerts.push(m),$:id=>{selectedId=id;return select;},
getAll:async(table,options)=>{assert.equal(options.strict,true);return table==='mechanics'?[{name:'Michael',status:'Active'},{name:'Former',status:'Inactive'}]:names.map(name=>({name}));},
supabase:{from:table=>{assert.equal(table,'issuance_employees');return {insert:async({name})=>{inserts++;if(fail)return {error:{message:'Denied'}};names.push(name);return {};}};}}});
vm.runInContext(functions(['issuanceRecipientOptions','loadPurchaseIssuanceRecipients','quickCreateIssuanceEmployee','shopIssuancePoFields','purchaseOrderShopIssuanceDetail']),c);
(async()=>{
await c.loadPurchaseIssuanceRecipients();assert.deepEqual(Array.from(c.productMeta.mechanics),['Michael']);
await c.quickCreateIssuanceEmployee();assert.equal(select.value,'Jane Doe');assert.equal(inserts,1);
entered='jane doe';await c.quickCreateIssuanceEmployee({type:'click'});assert.equal(inserts,1);assert.equal(selectedId,'purchaseShopEmployee');
await c.quickCreateIssuanceEmployee('supplyEmployee');assert.equal(selectedId,'supplyEmployee');
c.productMeta={};await c.loadPurchaseIssuanceRecipients();assert.equal(c.productMeta.issuanceEmployees[0],'Jane Doe');
const html=c.shopIssuancePoFields({charge_mode:'employee',issued_to:'Jane Doe'});assert.match(html,/value="employee" checked/);assert.match(html,/value="Jane Doe" selected/);assert.match(html,/value="Michael"/);
const legacy=c.shopIssuancePoFields({charge_mode:'mechanic',issued_to:'Former'});assert.match(legacy,/value="Former" selected/);
entered='Another';fail=true;await c.quickCreateIssuanceEmployee();assert.equal(select.value,'Jane Doe');assert.match(alerts[0],/Denied/);
const detail=c.purchaseOrderShopIssuanceDetail({notes:'SHOP_ISSUANCE_DETAIL:'+JSON.stringify({charge_mode:'employee',issued_to:'Jane Doe'})});assert.equal(detail.issued_to,'Jane Doe');assert.equal(detail.charge_mode,'employee');
assert.match(functions(['openPurchaseOrderModal']),/loadPurchaseIssuanceRecipients\(\)/);
assert.match(functions(['performPurchaseOrderSave']),/purchaseShopEmployee/);
assert.match(functions(['postAutomaticPurchaseShopIssuance']),/Employee: \$\{detail.issued_to\}/);
console.log('PO mechanics load independently; employee names persist, deduplicate and retain receipt recipient.');
})().catch(e=>{console.error(e);process.exitCode=1;});
