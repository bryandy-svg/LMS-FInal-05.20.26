const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { verify } = require('./release-manifest.cjs');
const root = path.resolve(__dirname, '..');
process.chdir(root);
execFileSync(process.execPath, ['--check', 'supabase-app/app.js'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/test-regressions.cjs'], { stdio: 'inherit' });
const { sourceHash } = verify();
let commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
if (!commit) {
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
}
if (process.env.VERCEL_ENV === 'production' && !/^[a-f0-9]{40}$/i.test(process.env.VERCEL_GIT_COMMIT_SHA || '')) {
  throw new Error('Production releases must be built from the connected Git repository, with a commit SHA.');
}
const source = path.join(root, 'supabase-app');
const target = path.resolve(root, 'dist');
if (target !== path.join(root, 'dist')) throw new Error('Invalid build output path.');
fs.mkdirSync(target, { recursive: true });
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
let html = fs.readFileSync(path.join(target, 'index.html'), 'utf8');
html = html.replace(/app\.js(?:\?v=[^"']*)?/, 'app.js?v=' + sourceHash.slice(0, 16));
html = html.replace('</head>', `<meta name="lms-release" content="${commit || 'local'}:${sourceHash}">\n</head>`);
fs.writeFileSync(path.join(target, 'index.html'), html);
fs.writeFileSync(path.join(target, 'release.json'), JSON.stringify({ commit: commit || null, sourceHash, builtAt: new Date().toISOString() }, null, 2));
console.log('Verified build ready:', commit || 'local preview', sourceHash);
