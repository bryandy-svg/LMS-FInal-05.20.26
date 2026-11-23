const crypto = require('node:crypto');
const {promisify} = require('node:util');
const scrypt = promisify(crypto.scrypt);
module.exports = async function(req,res) {
 res.setHeader('Cache-Control','no-store'); res.setHeader('Content-Type','application/json');
 const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
 const fail=(message,status=400)=>Object.assign(new Error(message),{status});
 try {
  if(req.method!=='POST')return send(405,{error:'Method not allowed'});
  const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)throw fail('Please sign in again.',401);
  const auth=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});
  if(!auth.ok)throw fail('Please sign in again.',401);
  const user=await auth.json();
  const db=async(path,body)=>{const r=await fetch(base+'/rest/v1/'+path,{method:body?'POST':'GET',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});if(!r.ok)throw fail('Could not complete the request. Please retry.',503);const text=await r.text();return text?JSON.parse(text):null;};
  const profiles=await db('app_profiles?id=eq.'+encodeURIComponent(user.id)+'&select=role');
  if(profiles[0]?.role!=='Administrator')throw fail('Only administrators can manage request portal accounts.',403);
  const input=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  if(input.action==='list') {
   const offset=Number(input.offset||0);if(!Number.isSafeInteger(offset)||offset<0)throw fail('Invalid page.');
   return send(200,{users:await db('request_portal_accounts?select=id,username,full_name,email,created_at&order=created_at.desc,id&limit=200&offset='+offset)});
  }
  if(input.action!=='reset')throw fail('Unknown action.');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id||''))throw fail('Select a valid account.');
  const password=String(input.password||'');if(password.length<10||password.length>128)throw fail('Use a password between 10 and 128 characters.');
  const salt=crypto.randomBytes(16).toString('hex');
  const passwordHash=salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex');
  await db('rpc/admin_reset_request_portal_password',{p_id:input.id,p_hash:passwordHash,p_actor:user.id});
  return send(200,{ok:true});
 }catch(e){send(e.status||500,{error:e.status?e.message:'Could not complete the request. Please retry.'});}
};
