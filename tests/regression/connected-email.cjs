const assert = require('node:assert/strict');
const crypto = require('node:crypto');
process.env.EMAIL_TOKEN_KEY = crypto.randomBytes(32).toString('base64');
process.env.EMAIL_APP_ORIGIN = 'https://lmsimports.vercel.app';
process.env.SUPABASE_URL = 'https://db.example';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
for (const p of ['MICROSOFT','GOOGLE']) {
  process.env['EMAIL_' + p + '_CLIENT_ID'] = 'client-test';
  process.env['EMAIL_' + p + '_CLIENT_SECRET'] = 'secret-test';
}
const handler = require('../../api/email.js'), { seal, unseal, message, mime } = handler.testing;
const owner = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
const ciphertext = seal({ refresh_token:'secret' }, owner + ':gmail');
assert.equal(unseal(ciphertext, owner + ':gmail').refresh_token, 'secret');
assert.throws(() => unseal(ciphertext, other + ':gmail'));
assert.throws(() => unseal(ciphertext, owner + ':outlook'));
assert.throws(() => message({ to:'x@example.com', subject:'x\r\nBcc: bad@example.com' }));
assert.throws(() => message({ to:'x@example.com\r\nBcc:bad@example.com', subject:'x' }));
assert.throws(() => message({ to:'x@example.com', subject:'x', attachments:[{name:'x.pdf',content:Buffer.from('not a pdf').toString('base64')}] }));
const pdf = { name:'invoice.pdf', content:Buffer.from('%PDF-1.7\nfixture').toString('base64') };
const mail = message({ to:'a@example.com;a@example.com', cc:'b@example.com', subject:'Invoice ✓', text:'Hello', attachments:[pdf] });
assert.equal(mail.to.length, 1);
const decoded = Buffer.from(mime(mail, 'owner@example.com'), 'base64url').toString();
assert.match(decoded, /Content-Type: application\/pdf/); assert.match(decoded, /Cc: b@example.com/);
const accounts = [], logs = []; let sends = 0, providerMode = 'ok';
function response(data, status = 200) { return new Response(JSON.stringify(data), { status, headers:{'Content-Type':'application/json'} }); }
global.fetch = async (input, options = {}) => {
  const url = new URL(input);
  if (url.pathname === '/auth/v1/user') return options.headers.Authorization === 'Bearer owner' ? response({id:owner}) : options.headers.Authorization === 'Bearer other' ? response({id:other}) : response({},401);
  if (url.pathname.includes('/rest/v1/')) {
    const table = url.pathname.split('/').pop(), rows = table === 'email_accounts' ? accounts : logs;
    const data = options.body ? JSON.parse(options.body) : null;
    const selected = () => rows.filter(row => [...url.searchParams].every(([key,value]) => !value.startsWith('eq.') || String(row[key]) === value.slice(3)));
    if (options.method === 'POST') {
      const keys = table === 'email_accounts' ? ['user_id','provider'] : ['user_id','request_id'];
      const existing = rows.find(r => keys.every(k => r[k] === data[k]));
      if (existing && options.headers.Prefer.includes('ignore-duplicates')) return response([]);
      if (existing) Object.assign(existing,data); else rows.push(data);
      return response([existing || data]);
    }
    if (options.method === 'PATCH') { const result=selected(); result.forEach(r=>Object.assign(r,data)); return response(result); }
    if (options.method === 'DELETE') { const found=selected(); found.forEach(r=>rows.splice(rows.indexOf(r),1)); return response(found); }
    const fields=url.searchParams.get('select');
    return response(selected().map(r=>fields ? Object.fromEntries(fields.split(',').map(k=>[k,r[k]])) : r));
  }
  if (url.pathname.endsWith('/token')) return response({ access_token:'provider-access', refresh_token:'rotated-refresh' });
  if (url.pathname.includes('userinfo')) return response({email:'gmail@example.com'});
  if (url.pathname === '/v1.0/me') return response({mail:'outlook@example.com'});
  if (url.pathname.endsWith('/send') || url.pathname.endsWith('/sendMail')) {
    sends++;
    assert.equal(options.headers.Authorization, 'Bearer provider-access');
    const payload=JSON.parse(options.body);
    if (url.pathname.endsWith('/sendMail')) assert.equal(payload.message.attachments[0].contentBytes,pdf.content);
    else assert.match(Buffer.from(payload.raw,'base64url').toString(),/invoice.pdf/);
    if (providerMode === 'network') throw new Error('connection reset');
    return response({},providerMode === 'rejected' ? 403 : 200);
  }
  throw new Error('Unexpected fetch ' + input);
};
async function call(action, body, auth='owner', extras={}) {
  const headers={ authorization:'Bearer '+auth, origin:process.env.EMAIL_APP_ORIGIN, ...extras.headers };
  const req={url:'/api/email?action='+action,method:body ? 'POST':'GET',headers,body,...extras};
  req.headers=headers;
  const res={headers:{},setHeader(k,v){this.headers[k]=v},end(text){this.text=text;try{this.data=JSON.parse(text)}catch{}}};
  await handler(req,res);return res;
}
(async()=>{
  assert.equal((await call('status',null,'invalid')).statusCode,401);
  const start=await call('connect',{provider:'gmail'});assert.equal(start.statusCode,200);
  assert.match(start.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Lax/);
  const authorize=new URL(start.data.url);assert.equal(authorize.searchParams.get('code_challenge_method'),'S256');
  assert.equal(authorize.searchParams.get('redirect_uri'),'https://lmsimports.vercel.app/api/email-callback');
  const cookie=start.headers['Set-Cookie'].split(';')[0];
  const bad=await call('callback',null,'owner',{url:'/api/email?action=callback&code=ok&state=wrong',headers:{cookie}});
  assert.equal(bad.statusCode,401);assert.equal(accounts.length,0);
  const done=await call('callback',null,'owner',{url:'/api/email?action=callback&code=ok&state='+authorize.searchParams.get('state'),headers:{cookie}});
  assert.equal(done.statusCode,200);assert.equal(accounts[0].user_id,owner);assert.ok(!accounts[0].token_cipher.includes('rotated-refresh'));
  assert.deepEqual((await call('status',null,'other')).data.accounts,[]);
  assert.ok(!JSON.stringify((await call('status')).data).includes('token_cipher'));
  const payload={provider:'gmail',requestId:crypto.randomUUID(),to:'customer@example.com',subject:'Invoice',text:'Hi',attachments:[pdf]};
  const denied=await call('send',payload,'other');assert.equal(denied.statusCode,400);assert.equal(sends,0);
  assert.equal((await call('send',payload,'owner',{headers:{origin:'https://evil.example'}})).statusCode,403);
  const first=await call('send',payload);assert.equal(first.data.status,'Accepted');assert.equal(sends,1);
  assert.equal((await call('send',payload)).data.duplicate,true);assert.equal(sends,1);
  assert.equal((await call('send',{...payload,subject:'Changed'})).statusCode,409);assert.equal(sends,1);
  assert.deepEqual((await call('log',null,'other')).data.entries,[]);
  const concurrent={...payload,requestId:crypto.randomUUID()};await Promise.all([call('send',concurrent),call('send',concurrent)]);assert.equal(sends,2);
  providerMode='network';const uncertain={...payload,requestId:crypto.randomUUID()};assert.equal((await call('send',uncertain)).data.status,'Unknown');
  await call('send',uncertain);assert.equal(sends,3);
  accounts.push({user_id:owner,provider:'outlook',email:'outlook@example.com',token_cipher:seal({refresh_token:'outlook-refresh'},owner+':outlook')});
  providerMode='ok';assert.equal((await call('send',{...payload,provider:'outlook',requestId:crypto.randomUUID()})).data.status,'Accepted');assert.equal(sends,4);
  await call('disconnect',{provider:'gmail'},'other');assert.equal(accounts.length,2);
  await call('disconnect',{provider:'gmail'});assert.equal(accounts.length,1);
  assert.equal((await call('send',{...payload,requestId:crypto.randomUUID()})).statusCode,400);
  console.log('PASS OAuth state, encrypted owner binding, cross-user isolation, both providers, PDF payloads, concurrent deduplication, unknown-delivery retry, and disconnect');
})().catch(e=>{console.error(e);process.exitCode=1});
