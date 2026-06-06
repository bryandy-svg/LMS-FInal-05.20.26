const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "supabase-app");
const target = path.join(root, "dist");

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

fs.cpSync(source, target, { recursive: true });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const configFile = path.join(target, "supabase-config.js");

fs.writeFileSync(
  configFile,
  `export const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};\n` +
    `export const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};\n`
);

console.log("Vercel build ready: copied supabase-app to dist and wrote Supabase config from Vercel variables.");
