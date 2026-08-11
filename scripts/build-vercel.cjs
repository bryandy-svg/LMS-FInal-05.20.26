const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "supabase-app");
const target = path.join(root, "dist");

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });

console.log("Vercel build ready: copied supabase-app to dist.");
