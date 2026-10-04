const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions}=require('../source.cjs');
let reads=0,complete;
const c=vm.createContext({Map,Promise,Error,structuredClone,AbortController,session:{user:{id:'one'}},viewReadCache:new Map(),viewReadGeneration:0,viewWritesInProgress:0,getAll:async()=>{reads++;return [{id:1,qty:2}];}});
vm.runInContext(functions(['getPagedViewRows']),c);
(async()=>{
 const [a,b]=await Promise.all([c.getPagedViewRows('products'),c.getPagedViewRows('products')]);assert.equal(reads,1);a[0].qty=99;assert.equal(b[0].qty,2);
 for(let i=0;i<140;i++)await c.getPagedViewRows('module_'+i);
 await c.getPagedViewRows('products');assert.equal(reads,141,'Navigation must retain earlier modules');
 c.session.user.id='two';await c.getPagedViewRows('products');assert.equal(reads,142,'Cache isolates users');
 c.getAll=()=>new Promise(resolve=>complete=resolve);const pending=c.getPagedViewRows('pending');await Promise.resolve();c.viewReadGeneration++;complete([{id:7}]);await assert.rejects(pending,/Data changed/);
 c.getAll=async()=>[{id:8}];assert.equal((await c.getPagedViewRows('pending'))[0].id,8,'Stale in-flight response cannot repopulate cache');
 console.log('Session reuse, duplicate requests, independent copies, account isolation and in-flight invalidation passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
