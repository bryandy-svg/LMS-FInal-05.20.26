const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const s=fs.readFileSync('supabase-app/app.js','utf8');
function extract(name){const i=s.indexOf('function '+name+'(');assert(i>=0);return s.slice(s.slice(i-6,i)==='async '?'async '.length+i-6:i,s.indexOf('\n}',i)+2);}
(async()=>{
 const el={modalTitle:{},modalBody:{},modalSave:{style:{}},modal:{style:{}}};let fail=false,saved=0,closed=0,args;
 const c=vm.createContext({$:id=>el[id],esc:v=>String(v),badge:v=>'<span>'+v+'</span>',productSelect:()=>'<select></select>',document:{querySelector:()=>({value:'High'})},supabase:{rpc:async(name,p)=>{args=p;return fail?{error:{message:'Rejected'}}:{data:{priority:'High'}};}},invalidateChangedTable:()=>{},closeModal:force=>{assert(force);closed++;},alert:()=>{}});
 vm.runInContext(extract('reportWorkOrderPriorityButton')+'\n'+extract('openReportWorkOrderPriority'),c);
 const wo={id:'one',wo_no:'W1',asset_tag:'A1',priority:'Medium'};
 assert(c.reportWorkOrderPriorityButton('Medium',{...wo,is_open:true}).includes('data-report-wo-priority'));
 assert(!c.reportWorkOrderPriorityButton('Medium',{...wo,is_open:false}).includes('button'));
 c.openReportWorkOrderPriority(wo,()=>saved++);await el.modalSave.onclick();assert.equal(wo.priority,'High');assert.equal(saved,1);assert.equal(closed,1);assert.equal(args.p_expected_priority,'Medium');
 fail=true;c.openReportWorkOrderPriority(wo,()=>saved++);await el.modalSave.onclick();assert.equal(saved,1);assert.equal(el.modalSave.disabled,false);
 assert(s.includes('if(wo)openReportWorkOrderPriority(wo,apply)'));
 assert(s.includes('record.priority_override='));
 assert.equal((s.match(/priority: reportWorkOrderPriorityButton/g)||[]).length,2);
 console.log('PASS active-only priority controls, atomic request, immediate regroup callback, failed-save handling and explicit default override wiring');
})().catch(e=>{console.error(e);process.exitCode=1;});
