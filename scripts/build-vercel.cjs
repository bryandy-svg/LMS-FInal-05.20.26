const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "supabase-app");
const target = path.join(root, "dist");

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const from = path.join(source, entry.name);
  const to = path.join(target, entry.name);
  fs.copyFileSync(from, to);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const configFile = path.join(target, "supabase-config.js");
fs.writeFileSync(configFile, [
  "// Generated during Vercel build from this project's environment variables.",
  "export const SUPABASE_URL = " + JSON.stringify(supabaseUrl) + ";",
  "export const SUPABASE_ANON_KEY = " + JSON.stringify(supabaseAnonKey) + ";",
  "",
].join("\n"));

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing. The app will show the database connection message.");
}

console.log("Vercel build ready: copied supabase-app to dist.");
