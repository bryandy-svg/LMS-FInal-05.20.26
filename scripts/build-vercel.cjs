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

console.log("Vercel build ready: copied supabase-app to dist.");
