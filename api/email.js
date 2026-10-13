const crypto = require('node:crypto');
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const uuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');
const sha = value => crypto.createHash('sha256').update(value).digest('base64url');
function config(provider) {
  const microsoft = provider === 'outlook';
  if (!microsoft && provider !== 'gmail') throw fail('Choose Outlook or Gmail.');
  const prefix = microsoft ? 'EMAIL_MICROSOFT' : 'EMAIL_GOOGLE';
  return {
    id: process.env[prefix + '_CLIENT_ID'], secret: process.env[prefix + '_CLIENT_SECRET'],
    authorize: microsoft ? 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' : 'https://accounts.google.com/o/oauth2/v2/auth',
    token: microsoft ? 'https://login.microsoftonline.com/common/oauth2/v2.0/token' : 'https://oauth2.googleapis.com/token',
    scope: microsoft ? 'offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Send' : 'openid email https://www.googleapis.com/auth/gmail.send',
  };
}
function origin() {
  const url = new URL(process.env.EMAIL_APP_ORIGIN || 'https://lmsimports.vercel.app');
  if (url.protocol !== 'https:') throw fail('Email requires HTTPS.', 503);
  return url.origin;
}
function key() {
  const bytes = Buffer.from(process.env.EMAIL_TOKEN_KEY || '', 'base64');
  if (bytes.length !== 32) throw fail('Email connection setup is not complete.', 503);
  return bytes;
}
function seal(value, purpose) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(purpose));
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
function unseal(value, purpose) {
  try {
    const bytes = Buffer.from(value, 'base64url'), decipher = crypto.createDecipheriv('aes-256-gcm', key(), bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose)); decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
  } catch { throw fail('Email connection expired. Please reconnect.', 401); }
}
async function db(path, method = 'GET', body, prefer = 'return=representation') {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !secret) throw fail('Email storage is not configured.', 503);
  const r = await fetch(base + '/rest/v1/' + path, { method, headers: { apikey: secret, Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json', Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw fail('Email storage is unavailable. Please try again.', 503);
  return r.status === 204 ? [] : r.json();
}
async function user(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw fail('Please sign in to LMS.', 401);
  const r = await fetch(String(process.env.SUPABASE_URL).replace(/\/$/, '') + '/auth/v1/user', { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) {
    if (r.status === 401 || r.status === 403) throw Object.assign(fail('Please sign in to LMS again.', 401), { code: 'SESSION_EXPIRED' });
    throw fail('Login verification is temporarily unavailable.', 503);
  }
  const u = await r.json();
  if (!uuid(u.id) || u.is_anonymous) throw fail('Please sign in to LMS.', 401);
  return u;
}
function addresses(value, required = false) {
  const list = [...new Set(String(value || '').split(/[;,\n]+/).map(x => x.trim()).filter(Boolean))];
  if ((required && !list.length) || list.length > 50 || list.some(x => !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(x))) throw fail('Enter valid email addresses, separated by commas or semicolons (maximum 50).');
  return list;
}
function message(body) {
  const to = addresses(body.to, true), cc = addresses(body.cc);
  const subject = String(body.subject || '').trim(), text = String(body.text || '');
  if (!subject || subject.length > 250 || /[\r\n]/.test(subject) || text.length > 100000) throw fail('Enter a subject up to 250 characters and a message up to 100,000 characters.');
  if (!Array.isArray(body.attachments || []) || (body.attachments || []).length > 10) throw fail('Attach up to 10 PDF files.');
  let size = 0;
  const attachments = (body.attachments || []).map(a => {
    const name = String(a.name || '').replace(/[^a-z0-9._ -]/gi, '_').slice(0, 120);
    const content = String(a.content || '');
    const bytes = Buffer.from(content, 'base64'); size += bytes.length;
    if (!/\.pdf$/i.test(name) || !/^[A-Za-z0-9+/]*={0,2}$/.test(content) || bytes.subarray(0, 5).toString() !== '%PDF-' || size > 2000000) throw fail('Attach PDF files only, up to 2 MB total.');
    return { name, content: bytes.toString('base64') };
  });
  return { to, cc, subject, text, attachments };
}
function mime(mail, from) {
  const boundary = 'lms_' + crypto.randomBytes(16).toString('hex');
  const b64 = value => Buffer.from(value).toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';
  const lines = [`From: ${from}`, `To: ${mail.to.join(', ')}`, ...(mail.cc.length ? [`Cc: ${mail.cc.join(', ')}`] : []), `Subject: =?UTF-8?B?${Buffer.from(mail.subject).toString('base64')}?=`, 'MIME-Version: 1.0', `Content-Type: multipart/mixed; boundary="${boundary}"`, '', `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64(mail.text)];
  for (const a of mail.attachments) lines.push(`--${boundary}`, `Content-Type: application/pdf; name="${a.name}"`, `Content-Disposition: attachment; filename="${a.name}"`, 'Content-Transfer-Encoding: base64', '', a.content.match(/.{1,76}/g).join('\r\n'));
  lines.push(`--${boundary}--`, '');
  return Buffer.from(lines.join('\r\n')).toString('base64url');
}
async function tokenRequest(provider, params) {
  const c = config(provider);
  if (!c.id || !c.secret) throw fail('This email provider is not configured yet.', 503);
  const r = await fetch(c.token, { method: 'POST', body: new URLSearchParams({ client_id: c.id, client_secret: c.secret, ...params }), signal: AbortSignal.timeout(15000) });
  const t = await r.json();
  if (!r.ok || !t.access_token) throw fail('Email authorization expired or was declined. Please reconnect your account.', 401);
  return t;
}
function reply(res, status, data) {
  res.statusCode = status; res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data));
}
async function handler(req, res) {
  const url = new URL(req.url, origin()), action = url.searchParams.get('action') || 'status';
  try {
    if (action === 'callback') {
      if (req.method !== 'GET') throw fail('Method not allowed.', 405);
      const cookie = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('__Host-lms_email='))?.slice('__Host-lms_email='.length);
      res.setHeader('Set-Cookie', '__Host-lms_email=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
      const state = unseal(cookie || '', 'oauth-state');
      if (!state.state || sha(url.searchParams.get('state') || '') !== sha(state.state) || state.expires < Date.now()) throw fail('Email sign-in expired. Start again.', 401);
      if (url.searchParams.has('error')) throw fail('Email permission was declined. You can close this window and try again.');
      const code = url.searchParams.get('code');
      if (!code) throw fail('Email sign-in did not return a code.');
      const tokens = await tokenRequest(state.provider, { grant_type: 'authorization_code', code, redirect_uri: origin() + '/api/email-callback', code_verifier: state.verifier });
      const profileUrl = state.provider === 'gmail' ? 'https://openidconnect.googleapis.com/v1/userinfo' : 'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName';
      const r = await fetch(profileUrl, { headers: { Authorization: 'Bearer ' + tokens.access_token }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw fail('Could not identify this mailbox. Reconnect and accept the requested permissions.');
      const p = await r.json(), email = p.email || p.mail || p.userPrincipalName;
      addresses(email, true);
      if (!tokens.refresh_token) throw fail('Offline email permission was not granted. Reconnect and accept permissions.');
      await db('email_accounts?on_conflict=user_id,provider', 'POST', { user_id: state.userId, provider: state.provider, email, token_cipher: seal({ refresh_token: tokens.refresh_token }, state.userId + ':' + state.provider), connected_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=representation');
      res.statusCode = 200; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
      return res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Email connected</title><h1>Email connected</h1><p>You can close this tab and return to LMS. Select Refresh connections to see your mailbox.</p>');
    }
    if (!['GET','POST'].includes(req.method)) throw fail('Method not allowed.', 405);
    const u = await user(req), filter = 'user_id=eq.' + u.id;
    if (action === 'status' && req.method === 'GET') {
      const ready = Boolean(process.env.EMAIL_TOKEN_KEY);
      const providers = ['outlook','gmail'].map(provider => ({ provider, configured: ready && Boolean(config(provider).id && config(provider).secret) }));
      const accounts = await db('email_accounts?' + filter + '&select=provider,email,connected_at');
      return reply(res, 200, { accounts, providers });
    }
    if (action === 'log' && req.method === 'GET') return reply(res, 200, { entries: await db('email_send_log?' + filter + '&select=request_id,provider,sender,recipients,subject,status,created_at&order=created_at.desc&limit=50') });
    if (req.method !== 'POST') throw fail('Method not allowed.', 405);
    if (req.headers.origin !== origin()) throw fail('Open email settings from the main LMS site.', 403);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const provider = body.provider, c = config(provider);
    if (action === 'connect') {
      if (!c.id || !c.secret) throw fail('This provider needs one-time administrator setup before you can connect.', 503);
      const state = crypto.randomBytes(32).toString('base64url'), verifier = crypto.randomBytes(48).toString('base64url');
      const cookie = seal({ state, verifier, provider, userId: u.id, expires: Date.now() + 600000 }, 'oauth-state');
      res.setHeader('Set-Cookie', `__Host-lms_email=${cookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
      const params = new URLSearchParams({ client_id: c.id, response_type: 'code', redirect_uri: origin() + '/api/email-callback', scope: c.scope, state, code_challenge: sha(verifier), code_challenge_method: 'S256', prompt: 'consent' });
      if (provider === 'gmail') params.set('access_type', 'offline');
      return reply(res, 200, { url: c.authorize + '?' + params });
    }
    if (action === 'disconnect') {
      await db('email_accounts?' + filter + '&provider=eq.' + provider, 'DELETE');
      return reply(res, 200, { disconnected: true });
    }
    if (action !== 'send') throw fail('Unknown email action.');
    if (!uuid(body.requestId)) throw fail('A send request identifier is required.');
    const mail = message(body), hash = sha(JSON.stringify({ provider, mail }));
    const logFilter = filter + '&request_id=eq.' + body.requestId;
    const prior = (await db('email_send_log?' + logFilter))[0];
    if (prior) {
      if (prior.payload_hash !== hash) throw fail('This send request was already used. Open a new email to change its contents.', 409);
      return reply(res, 200, { status: prior.status, duplicate: true });
    }
    const account = (await db('email_accounts?' + filter + '&provider=eq.' + provider))[0];
    if (!account) throw fail('Connect this email account first.');
    const stored = unseal(account.token_cipher, u.id + ':' + provider);
    const tokens = await tokenRequest(provider, { grant_type: 'refresh_token', refresh_token: stored.refresh_token });
    if (tokens.refresh_token) await db('email_accounts?' + filter + '&provider=eq.' + provider + '&token_cipher=eq.' + encodeURIComponent(account.token_cipher), 'PATCH', { token_cipher: seal({ refresh_token: tokens.refresh_token }, u.id + ':' + provider) });
    // Atomically reserve each user's request before calling either provider. A
    // retry never repeats an ambiguous send; it returns the recorded status.
    const claimed = await db('email_send_log?on_conflict=user_id,request_id', 'POST', { user_id: u.id, request_id: body.requestId, provider, sender: account.email, recipients: [...mail.to, ...mail.cc], subject: mail.subject, payload_hash: hash, status: 'Sending' }, 'resolution=ignore-duplicates,return=representation');
    if (!claimed.length) return reply(res, 200, { status: 'Sending', duplicate: true });
    let status = 'Unknown';
    try {
      const target = provider === 'gmail' ? 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send' : 'https://graph.microsoft.com/v1.0/me/sendMail';
      const payload = provider === 'gmail' ? { raw: mime(mail, account.email) } : { message: { subject: mail.subject, body: { contentType: 'Text', content: mail.text }, toRecipients: mail.to.map(address => ({ emailAddress: { address } })), ccRecipients: mail.cc.map(address => ({ emailAddress: { address } })), attachments: mail.attachments.map(a => ({ '@odata.type': '#microsoft.graph.fileAttachment', name: a.name, contentType: 'application/pdf', contentBytes: a.content })) }, saveToSentItems: true };
      const sent = await fetch(target, { method: 'POST', headers: { Authorization: 'Bearer ' + tokens.access_token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
      status = sent.ok ? 'Accepted' : sent.status < 500 ? 'Rejected' : 'Unknown';
    } catch { /* Do not resend when provider delivery is uncertain. */ }
    try { await db('email_send_log?' + logFilter, 'PATCH', { status }); }
    catch { return reply(res, 200, { status, logPending: true }); }
    return reply(res, 200, { status });
  } catch (error) { return reply(res, error.status || 500, { error: error.status ? error.message : 'Email could not be completed. Your draft has been kept.', ...(error.code ? { code: error.code } : {}) }); }
}
module.exports = handler;
module.exports.testing = { config, seal, unseal, message, mime, addresses };
