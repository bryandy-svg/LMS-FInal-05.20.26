const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, "");
const BUCKET = "shared-documents";
const EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;

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

function storageHeaders(extra = {}) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...extra };
}

async function requireUser(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) throw Object.assign(new Error("Please log in before creating a share link."), { status: 401 });
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) throw Object.assign(new Error("Your login session expired. Please log in again."), { status: 401 });
  return response.json();
}

async function ensurePrivateBucket() {
  const existing = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${BUCKET}`, { headers: storageHeaders() });
  if (existing.ok) return;
  if (existing.status !== 404 && existing.status !== 400) throw new Error(`Could not check secure document storage (${existing.status}).`);
  const created = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: storageHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: 4000000, allowed_mime_types: ["application/pdf"] }),
  });
  if (!created.ok && created.status !== 409) throw new Error(`Could not create secure document storage (${created.status}).`);
}

function safeFileName(value) {
  const name = String(value || "document.pdf").replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return /\.pdf$/i.test(name) ? name : `${name || "document"}.pdf`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) throw Object.assign(new Error("Secure document storage is not configured."), { status: 500 });
    const user = await requireUser(req);
    const body = await readBody(req);
    const fileName = safeFileName(body.fileName);
    const reference = String(body.reference || "document").replace(/[^a-z0-9_-]+/gi, "-");
    const documentType = String(body.documentType || "document").replace(/[^a-z0-9_-]+/gi, "-");
    const bytes = Buffer.from(String(body.fileBase64 || ""), "base64");
    if (!bytes.length) throw Object.assign(new Error("The generated PDF was empty."), { status: 400 });
    if (bytes.length > 4000000) throw Object.assign(new Error("The PDF is too large to share by email link."), { status: 413 });
    await ensurePrivateBucket();
    const objectPath = `${documentType}/${reference}/${Date.now()}-${String(user.id || "user").slice(0, 8)}-${fileName}`;
    const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: storageHeaders({ "Content-Type": "application/pdf", "x-upsert": "true" }),
      body: bytes,
    });
    if (!upload.ok) throw new Error(`Could not store the secure PDF (${upload.status}).`);
    const signed = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${objectPath.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: storageHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn: EXPIRES_IN_SECONDS }),
    });
    const signedData = await signed.json().catch(() => ({}));
    if (!signed.ok || !signedData.signedURL) throw new Error(signedData.message || "Could not create the secure download URL.");
    const signedUrl = new URL(signedData.signedURL, SUPABASE_URL);
    signedUrl.searchParams.set("download", fileName);
    return send(res, 200, { signedUrl: signedUrl.toString(), expiresIn: EXPIRES_IN_SECONDS, fileName });
  } catch (error) {
    return send(res, Number(error.status || 500), { error: error.message || "Could not create the secure PDF link." });
  }
};
