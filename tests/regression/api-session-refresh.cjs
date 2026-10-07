const vm=require('node:vm'),assert=require('node:assert/strict');
const {functions}=require('../source.cjs');
let tokens=[],responses=[],refreshes=0,failRefresh=false;
const c={session:{user:{id:'u'},access_token:'stale'},supabase:{auth:{
 getSession:async()=>({data:{session:{user:{id:'u'},access_token:'current'}}}),
 refreshSession:async()=>{refreshes++;if(failRefresh)throw Error('Offline');return {data:{session:{user:{id:'u'},access_token:'renewed'}}};}
}},fetch:async(path,options)=>{tokens.push(options.headers.Authorization);const next=responses.shift();return {status:next.status,clone:()=>({json:async()=>next})};}};
vm.createContext(c);vm.runInContext(functions(['authenticatedAppFetch']),c);
(async()=>{
 responses=[{status:200}];await c.authenticatedAppFetch('/api/create-user',{headers:{},body:'same'});assert.equal(tokens[0],'Bearer current');
 tokens=[];responses=[{status:401,code:'SESSION_EXPIRED'},{status:200}];await c.authenticatedAppFetch('/api/create-user',{headers:{}});assert.deepEqual(tokens,['Bearer current','Bearer renewed']);assert.equal(refreshes,1);
 tokens=[];responses=[{status:403}];await c.authenticatedAppFetch('/api/create-user',{headers:{}});assert.equal(tokens.length,1);assert.equal(refreshes,1);
 tokens=[];responses=[{status:401}];await c.authenticatedAppFetch('/api/create-user',{headers:{}});assert.equal(tokens.length,1,'Never retry a write on an unclassified failure');
 tokens=[];responses=[{status:401,code:'SESSION_EXPIRED'},{status:401,code:'SESSION_EXPIRED'}];await c.authenticatedAppFetch('/api/create-user',{headers:{}});assert.equal(tokens.length,2,'Retry at most once');
 failRefresh=true;responses=[{status:401,code:'SESSION_EXPIRED'}];await assert.rejects(c.authenticatedAppFetch('/api/create-user',{headers:{}}),/Offline/);
 c.supabase.auth.getSession=async()=>({data:{session:null}});await assert.rejects(c.authenticatedAppFetch('/api/create-user',{headers:{}}),/sign in/);
 c.supabase.auth.getSession=async()=>({data:{session:{user:{id:'different'},access_token:'x'}}});await assert.rejects(c.authenticatedAppFetch('/api/create-user',{headers:{}}),/user changed/);
 console.log('Fresh API tokens, bounded auth-only retry, failure and account-switch protections passed');
})().catch(e=>{console.error(e);process.exitCode=1});
