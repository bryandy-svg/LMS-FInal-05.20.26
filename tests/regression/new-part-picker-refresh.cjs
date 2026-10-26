const assert = require('node:assert/strict');
const vm = require('node:vm');
const {functions, source} = require('../source.cjs');
(async () => {
  const part = {id:'new',sku:'7L-6580',name:'Test part',status:'Active'};
  const input = {}, stale = new WeakMap();
  stale.set(input,{term:'7L-6580',loading:false});
  let error = null;
  const query = {insert:()=>query,select:()=>query,single:async()=>({data:part,error})};
  const c = vm.createContext({productMeta:{products:[{id:'old',sku:'existing'}]},purchaseContext:{products:[]},remotePartInputs:stale,supabase:{from:()=>query}});
  vm.runInContext(functions(['publishSavedProduct','insertNewProduct']),c);
  await c.insertNewProduct(part);
  assert.equal(c.productMeta.products.length,2);
  assert.equal(c.purchaseContext.products,c.productMeta.products);
  assert.equal(c.remotePartInputs.get(input),undefined);
  c.publishSavedProduct({...part,name:'Updated'});
  assert.equal(c.productMeta.products.length,2);
  assert.equal(c.productMeta.products[1].name,'Updated');
  error = {message:'insert failed'};
  await assert.rejects(c.insertNewProduct(part), e => e.message === 'insert failed');
  assert.equal(c.productMeta.products[1].name,'Updated');
  assert.match(source,/if \(!remotePartInputs.get\(event.target\)\?\.loading\) remotePartInputs.delete\(event.target\)/);
  console.log('New part cache publication and stale-search reset passed');
})().catch(e=>{console.error(e);process.exit(1)});

