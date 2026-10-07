const vm=require('node:vm'), assert=require('node:assert/strict');
const {functions}=require('../source.cjs');
let listener, pending;
const classes=new Set();
const button={innerHTML:'Save',disabled:false,dataset:{},classList:{contains:k=>classes.has(k)},closest:()=>true,setAttribute(){},removeAttribute(){}};
Object.defineProperty(button,'textContent',{get(){return this.innerHTML},set(v){this.innerHTML=v}});
const c={window:{},document:{addEventListener:(_,fn)=>listener=fn},alert:()=>{}};
vm.createContext(c);vm.runInContext(functions(['installActionButtonFeedback']),c);c.installActionButtonFeedback();
(async()=>{
 for(const failure of [false,true]) {
  button.onclick=()=>{button.disabled=true;button.textContent='Saving…';return new Promise((resolve,reject)=>pending=()=>failure?reject(Error('Save failed')):resolve(null)).finally(()=>{button.disabled=false;button.textContent='Save';});};
  listener({target:{closest:()=>button}});
  const result=button.onclick();assert.equal(button.disabled,true);pending();await result;
  assert.equal(button.innerHTML,'Save');assert.equal(button.disabled,false);assert.equal(button._actionPending,false);
 }
 // The main modal save guard already owns its feedback before the handler runs.
 classes.add('modal-save-busy');button.innerHTML='Saving…';button.disabled=true;
 button.onclick=async()=>{button.innerHTML='Save and Close';button.disabled=false;};
 listener({target:{closest:()=>button}});await button.onclick();
 assert.equal(button.innerHTML,'Save and Close');assert.equal(button.disabled,false);
 console.log('Nested save feedback restores idle labels and buttons after failure and validation returns');
})().catch(e=>{console.error(e);process.exitCode=1});
