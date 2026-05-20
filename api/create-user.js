const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim();
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, "");

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body || "{}");
}

async function supa(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message = data?.message || data?.error_description || data?.error || text || "Supabase request failed.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function getRequester(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) throw Object.assign(new Error("Please log in first."), { status: 401 });
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw Object.assign(new Error("Login session expired. Please log out and log in again."), { status: 401 });
  return response.json();
}

async function assertCanManageUsers(req) {
  const user = await getRequester(req);
  const rows = await supa(`/rest/v1/app_profiles?id=eq.${encodeURIComponent(user.id)}&select=role,modules`);
  const profile = rows?.[0];
  const userModules = profile?.modules || [];
  const allowed = profile?.role === "Administrator" || userModules.includes("all") || userModules.includes("users");
  if (!allowed) throw Object.assign(new Error("Your login does not have permission to create users."), { status: 403 });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,authorization");
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!SUPABASE_URL) return send(res, 500, { error: "Missing Vercel variable: SUPABASE_URL." });
  if (!SERVICE_KEY) return send(res, 500, { error: "Missing Vercel variable: SUPABASE_SERVICE_ROLE_KEY." });

  try {
    await assertCanManageUsers(req);
    const input = await readBody(req);
    const email = String(input.email || "").trim().toLowerCase();
    const username = String(input.username || "").trim();
    const fullName = String(input.full_name || username || email).trim();
    const role = String(input.role || "User").trim();
    const selectedModules = Array.isArray(input.modules) && input.modules.length ? input.modules : ["dashboard"];
    const password = String(input.password || "");

    if (!email) return send(res, 400, { error: "Email is required." });
    if (!username) return send(res, 400, { error: "Username is required." });
    if (!input.id && password.length < 6) return send(res, 400, { error: "Password must be at least 6 characters." });

    const authBody = {
      email,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    };
    if (password) authBody.password = password;

    const authUser = input.id
      ? await supa(`/auth/v1/admin/users/${encodeURIComponent(input.id)}`, { method: "PUT", body: JSON.stringify(authBody) })
      : await supa("/auth/v1/admin/users", { method: "POST", body: JSON.stringify(authBody) });

    const userId = authUser?.id || input.id;
    const profile = {
      id: userId,
      email,
      username,
      full_name: fullName,
      role,
      modules: selectedModules,
    };
    const saved = await supa("/rest/v1/app_profiles?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(profile),
    });

    send(res, 200, { ok: true, profile: saved?.[0] || profile });
  } catch (error) {
    send(res, error.status || 500, { error: error.message || "Could not save user." });
  }
};
