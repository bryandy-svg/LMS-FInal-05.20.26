const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const COOKIE = '__Host-lms-request';
const fail = (message, status=400) => Object.assign(new Error(message),{status});
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const emailValue = value => {const email=String(value||'').trim().toLowerCase();if(!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email)||email.length>254)throw fail('Enter a valid email address.');return email;};
const clean = (v,max=500) => String(v??'').trim().slice(0,max);
const uuid = v => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v||'');
const pick = (obj,keys) => Object.fromEntries(keys.split(',').filter(k=>Object.hasOwn(obj,k)).map(k=>[k,obj[k]]));
async function db(path,method='GET',body){
 const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!key)throw fail('Request access is not configured.',503);
 const r=await fetch(base+'/rest/v1/'+path,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const data=await r.json().catch(()=>null);
 if(!r.ok){if(data?.code==='23505')throw fail('An account or request already exists. Please log in or refresh.',409);throw fail('Could not complete this request. Please retry.',503);}
 return data;
}
async function limit(key,max=20,seconds=900){if(!await db('rpc/request_portal_rate_limit','POST',{p_key:hash(key),p_max:max,p_seconds:seconds}))throw fail('Too many attempts. Please try again later.',429);}
async function identity(req){const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||!/^[a-f0-9]{64}$/.test(token))throw fail('Please log in or continue as guest.',401);const rows=await db('request_portal_sessions?token_hash=eq.'+hash(token)+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&limit=1');if(!rows.length)throw fail('Your request session expired. Please sign in again.',401);return rows[0];}
async function begin(res,person,mode,owner){const token=crypto.randomBytes(32).toString('hex');await db('request_portal_sessions','POST',{token_hash:hash(token),owner_id:owner||crypto.randomUUID(),email:person.email,full_name:person.full_name,mode,expires_at:new Date(Date.now()+(mode==='guest'?8:24)*3600000).toISOString()});res.setHeader('Set-Cookie',COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict'+(mode==='guest'?'':'; Max-Age=86400'));return {email:person.email,full_name:person.full_name,mode};}
async function staffBy(field,value){if(!['email','username'].includes(field))throw fail('Invalid login.');return (await db('rpc/request_portal_find_staff','POST',{p_field:field,p_value:value}))[0];}
async function hasAccount(email){const rows=await db('request_portal_accounts?email=eq.'+encodeURIComponent(email)+'&select=id&limit=1');return !!(rows.length||await staffBy('email',email));}
async function encodePassword(password){const salt=crypto.randomBytes(16).toString('hex');return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex');}
async function checkPassword(password,stored){const [salt,expected]=String(stored||'').split(':');if(!salt||!expected)return false;const got=Buffer.from(await scrypt(password,salt,64)),want=Buffer.from(expected,'hex');return got.length===want.length&&crypto.timingSafeEqual(got,want);}
const READS={
 assets:'id,asset_tag,type,general_type,name,make,model,vin_serial,plate,location,status,size,assigned_operator',
 outside_customer_fleet:'id,reference,customer_name,vin,model,make,description,status,plate',
 customers:'id,reference,name', asset_locations:'id,name',locations:'id,name',
 property_maintenance_properties:'id,property_no,property_name,status',
 trucking_rates:'*',trucking_requests:'*',trucking_request_lines:'*',equipment_requests:'*',property_maintenance_requests:'*'
};
const OWN={trucking_requests:'trucking',trucking_request_lines:'trucking',equipment_requests:'equipment',property_maintenance_requests:'property'};
async function readData(person,input){
 const url=new URL(String(input.path||''),'https://local.invalid');
 if(url.origin!=='https://local.invalid'||!url.pathname.startsWith('/rest/v1/'))throw fail('Read not permitted.',403);
 const table=url.pathname.slice('/rest/v1/'.length);
 if(['app_profiles','vendors','trucking_moves','trucking_payroll_hours','app_sequences'].includes(table))return [];
 if(!Object.hasOwn(READS,table))throw fail('This data is not available in the request portal.',403);
 const q=new URLSearchParams();q.set('select',READS[table]);
 // Never forward arbitrary PostgREST projections, OR clauses, joins or RPCs.
 for(const [key,value] of url.searchParams){
  if(['limit','offset'].includes(key)){if(/^\d+$/.test(value))q.set(key,String(Math.min(Number(value),key==='limit'?1000:100000)));}
  else if(key==='order'&&/^[a-z_]+\.(asc|desc)(\.nulls(first|last))?(,[a-z_]+\.(asc|desc)(\.nulls(first|last))?)*$/.test(value))q.set(key,value);
  else if(['id','request_no','name','reference','asset_tag','status'].includes(key)&&/^(eq|ilike|in)\./.test(value)&&value.length<2000)q.append(key,value);
 }
 if(OWN[table]){const links=await db('request_portal_links?owner_id=eq.'+person.owner_id+'&kind=eq.'+OWN[table]+'&select=request_no');if(!links.length)return [];q.append('request_no','in.('+links.map(x=>'"'+x.request_no.replace(/["\\]/g,'')+'"').join(',')+')');}
 return db((table==='locations'?'asset_locations':table)+'?'+q);
}
function validateFile(po){if(!po)return null;const type=po.po_attachment_type,data=String(po.po_attachment||'');if(!['application/pdf','image/png','image/jpeg','image/webp'].includes(type)||!data.startsWith('data:'+type+';base64,')||data.length>3500000||!/^[A-Za-z0-9+/]*={0,2}$/.test(data.split(',')[1]||''))throw fail('Upload a PDF or image PO up to 2.5 MB.');return pick(po,'po_attachment,po_attachment_name,po_attachment_type,po_attachment_size');}
async function submit(person,input){
 const kind=input.kind,src=input.record||{};if(!uuid(input.submission))throw fail('Please reopen the request form.');
 await limit('submit:'+person.owner_id,60,3600);
 const allowed={equipment:'asset_id,asset_tag,asset_name,asset_items,customer_name,location,requested_by,requested_signature,po_no,from_date,to_date,notes,po_attachment,po_attachment_name,po_attachment_type,po_attachment_size',trucking:'customer,project,jobsite,project_jobsite,contact_no,needed_date,requested_by,po_no,notes,delivery_period,origin,destination,service_needed,service_option,service_subcategory,service_size,service_reference,tipping_fee,trip_type,material_description,unit_of_measurement,weight_lb,dimensions,materials_loaded,number_of_loads,cy_per_load,total_cy,payment_mode,roll_off_tons,move_description',property:'property_id,property_no,property_name,requested_by,requestor_phone,category,priority,location_area,issue_description,preferred_date,notes',repair:'asset_id,requested_by,po_no,issue,priority,notes,operator,location,jobsite_location'};
 if(!allowed[kind])throw fail('Choose a request type.');const record=pick(src,allowed[kind]);record.requested_by=clean(src.requested_by)||person.full_name;
 if(kind==='equipment'){
  record.email_address=person.email;if(!src.po_no||!src.from_date||!src.to_date||src.to_date<src.from_date||!src.location||!src.requested_signature||!Array.isArray(src.asset_items)||!src.asset_items.length||src.asset_items.length>50)throw fail('Complete equipment, dates, location, PO and signature.');
  if(!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(String(src.requested_signature))||src.requested_signature.length>1500000)throw fail('Add a valid signature.');Object.assign(record,validateFile(src));if(!record.po_attachment)throw fail('Upload the customer PO.');
  const items=[];for(const item of src.asset_items){const asset=(await db('assets?asset_tag=eq.'+encodeURIComponent(item.asset_tag)+'&select=id,asset_tag,name,status&limit=1'))[0];if(!asset)throw fail('Choose saved equipment.');items.push({asset_id:asset.id,asset_tag:asset.asset_tag,asset_name:asset.name,location:src.location});}record.asset_items=items;record.asset_id=items[0].asset_id;record.asset_tag=items[0].asset_tag;record.asset_name=items[0].asset_name;
 }
 if(['equipment','trucking'].includes(kind)){const name=src.customer_name||src.customer;const rows=await db('customers?name=eq.'+encodeURIComponent(name||'')+'&select=name&limit=1');if(!rows.length)throw fail('Select a saved customer.');}
 if(kind==='trucking'){record.requestor_email=person.email;if(!src.move_description||!src.needed_date||!src.project_jobsite||!src.service_needed||!['AM','PM'].includes(src.delivery_period)||!['One-Way','Round Trip'].includes(src.trip_type)||!['PO','Cash','Credit Card'].includes(src.payment_mode)||(src.payment_mode==='PO'&&!src.po_no))throw fail('Complete the required move details.');if(!Array.isArray(input.lines)||!input.lines.length||input.lines.length>50)throw fail('Add the equipment or container lines.');const rates=await db('trucking_rates?select=service,parent_service,status');if(!rates.some(rate=>(rate.service===src.service_needed||rate.parent_service===src.service_needed)&&!/^inactive$/i.test(rate.status||'')))throw fail('Choose a saved service.');}
 if(kind==='property'){record.requestor_email=person.email;if(!uuid(src.property_id)||!src.issue_description)throw fail('Choose a property and describe the issue.');const property=(await db('property_maintenance_properties?id=eq.'+src.property_id+'&select=property_no,property_name&limit=1'))[0];if(!property)throw fail('Choose a saved property.');Object.assign(record,property);}
 if(kind==='repair'){record.email=person.email;if(!uuid(src.asset_id)||!src.issue||!src.po_no||!clean(src.jobsite_location))throw fail('Equipment, issue, PO number and charging jobsite are required.');}
 const lines=(input.lines||[]).map((line,index)=>({...pick(line,'asset_source,asset_tag,equipment_label,service,origin,destination,notes,container_no'),line_no:index+1}));
 return db('rpc/request_portal_submit','POST',{p_owner:person.owner_id,p_submission:input.submission,p_kind:kind,p_record:record,p_lines:lines,p_po:kind==='repair'?validateFile(input.po):null});
}
async function history(person){
 const links=await db('request_portal_links?owner_id=eq.'+person.owner_id+'&order=created_at.desc&limit=200');
 const tableByKind={trucking:'trucking_requests',equipment:'equipment_requests',property:'property_maintenance_requests',repair:'assets'};
 const live={};await Promise.all(Object.entries(tableByKind).map(async([kind,table])=>{const ids=links.filter(l=>l.kind===kind).map(l=>l.record_id);live[kind]=ids.length?await db(table+'?id=in.('+ids.map(encodeURIComponent).join(',')+')&select=id,status'):[];}));
 const refs=links.filter(l=>l.kind==='trucking').map(l=>l.request_no);const moves=refs.length?await db('trucking_moves?request_no=in.('+refs.map(encodeURIComponent).join(',')+')&select=request_no,ticket_no,status,move_date,request_line_no'):[];
 const lines=refs.length?await db('trucking_request_lines?request_no=in.('+refs.map(encodeURIComponent).join(',')+')&select=request_no,line_no,status'):[];
 return links.map(link=>{const row=live[link.kind]?.find(r=>String(r.id)===link.record_id);let status=row?.status||link.snapshot.status;const tickets=moves.filter(t=>t.request_no===link.request_no);const active=tickets.filter(t=>!/^cancelled$/i.test(t.status));const pendingLine=lines.some(line=>line.request_no===link.request_no&&!/^cancelled$/i.test(line.status||'')&&!active.some(ticket=>Number(ticket.request_line_no)===Number(line.line_no)));if(active.length&&!pendingLine&&active.every(t=>/^(finalized|complete|completed)$/i.test(t.status)))status='Completed';else if(active.length)status=active.some(t=>/^(finalized|complete|completed)$/i.test(t.status))?'Partially completed':'Scheduled';return {kind:link.kind,request_no:link.request_no,created_at:link.created_at,status,description:link.snapshot.move_description||link.snapshot.issue_description||link.snapshot.issue||link.snapshot.asset_name||'',tickets};});
}
async function handler(req,res){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};try{
 if(req.method!=='POST')return send(405,{error:'Method not allowed'});
 const origin=req.headers.origin;const expected='https://'+req.headers.host;if(origin!==expected)throw fail('Open the request portal on this site.',403);
 let input=req.body;if(typeof input==='string')input=JSON.parse(input);if(!input||typeof input!=='object')throw fail('Invalid request.');if(JSON.stringify(input).length>4000000)throw fail('Request is too large.',413);
 const action=input.action;
 if(['check','guest','register','login'].includes(action))await limit('ip:'+String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||'unknown').split(',')[0],50,900);
 if(action==='check'){const email=emailValue(input.email);return send(200,{exists:await hasAccount(email)});}
 if(action==='guest'||action==='register'){
  const email=emailValue(input.email),full_name=clean(input.full_name,120);if(!full_name)throw fail('Enter your name.');if(await hasAccount(email))return send(409,{exists:true,error:'You already have an account. Please enter your username and password.'});
  if(action==='guest')return send(200,{identity:await begin(res,{email,full_name},'guest')});
  const username=clean(input.username,80).toLowerCase(),password=String(input.password||'');if(!/^[a-z0-9._-]{3,80}$/.test(username))throw fail('Username must be 3–80 letters, numbers, dots, underscores or hyphens.');if(password.length<10||password.length>128)throw fail('Use a password between 10 and 128 characters.');if(await staffBy('username',username))throw fail('That username is already used. Please log in or choose another.',409);
  const account=(await db('request_portal_accounts','POST',{email,username,full_name,password_hash:await encodePassword(password)}))[0];return send(200,{identity:await begin(res,account,'account',account.id)});
 }
 if(action==='login'){
  const login=clean(input.username,254).toLowerCase(),password=String(input.password||'');if(!login||!password||password.length>128)throw fail('Enter your username and password.');await limit('login:'+login,10,900);
  const field=login.includes('@')?'email':'username',account=(await db('request_portal_accounts?'+field+'=eq.'+encodeURIComponent(login)+'&limit=1'))[0];
  if(account){if(!await checkPassword(password,account.password_hash))throw fail('Incorrect username or password.',401);return send(200,{identity:await begin(res,account,'account',account.id)});}
  const staff=await staffBy(field,login);if(!staff||String(staff.email).toLowerCase()==='request@lmsfm.com')throw fail('Use your personal account, or continue as guest.',401);
  const r=await fetch(process.env.SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:staff.email,password}),signal:AbortSignal.timeout(15000)});const auth=await r.json();if(!r.ok||auth.user?.id!==staff.id)throw fail('Incorrect username or password.',401);
  // Preserve existing permissions; append only the fixed request modules.
  await db('rpc/request_portal_add_access','POST',{p_user:staff.id});
  return send(200,{identity:await begin(res,staff,'company',staff.id),session:{access_token:auth.access_token,refresh_token:auth.refresh_token}});
 }
 if(action==='logout'){try{const person=await identity(req);await db('request_portal_sessions?token_hash=eq.'+person.token_hash,'DELETE');}catch(error){if(error.status!==401)throw error;}res.setHeader('Set-Cookie',COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');return send(200,{ok:true});}
 const person=await identity(req);
 if(action==='session')return send(200,{identity:{email:person.email,full_name:person.full_name,mode:person.mode}});
 if(action==='read')return send(200,{data:await readData(person,input)});
 if(action==='history')return send(200,{data:await history(person)});
 if(action==='submit')return send(200,{data:await submit(person,input)});
 throw fail('Unknown action.');
 }catch(error){send(error.status||500,{error:error.status?error.message:'Request access is temporarily unavailable. Please retry.'});}}
module.exports=handler;
module.exports._test={emailValue,checkPassword,encodePassword,validateFile,readData,submit,history,hasAccount};
