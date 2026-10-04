const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function fileHash(name) {
  const data = fs.readFileSync(path.join(root, name));
  if (name === 'vercel.json') {
    // Vercel rewrites formatting and adds platform metadata during Git builds.
    // Protect the app's routing/build settings, independent of that serialization.
    const config = JSON.parse(data.toString('utf8'));
    const keys = ['buildCommand', 'outputDirectory', 'routes', 'rewrites', 'redirects', 'headers', 'functions'];
    return hash(JSON.stringify(Object.fromEntries(keys.filter(key => config[key] !== undefined).map(key => [key, config[key]]))));
  }
  // Git may normalize Windows line endings; compare text content consistently on CI.
  return hash(/\.(?:js|cjs|mjs|css|html|json|md|sql|ya?ml|csv|txt|toml)$/i.test(name) ? data.toString('utf8').replace(/\r\n/g, '\n') : data);
}
function tree(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const name = directory + '/' + entry.name;
    return entry.isDirectory() ? tree(name) : [name];
  });
}
function snapshot() {
  const paths = [...tree('supabase-app'), ...tree('api'), ...tree('tests'), ...tree('scripts'), 'package.json', 'vercel.json'].sort();
  return Object.fromEntries(paths.map(name => [name, fileHash(name)]));
}
function verify() {
  const expected = JSON.parse(fs.readFileSync(path.join(root, 'release-source.json'), 'utf8'));
  const actual = snapshot();
  const changed = [...new Set([...Object.keys(expected.files), ...Object.keys(actual)])].filter(name => expected.files[name] !== actual[name]);
  if (changed.length) throw new Error('Release source differs from the reviewed manifest: ' + changed.join(', ') + '. Run tests, then npm run release:prepare and commit the resulting files.');
  return { sourceHash: hash(JSON.stringify(actual)), files: actual };
}
if (require.main === module) {
  if (process.argv.includes('--write')) {
    fs.writeFileSync(path.join(root, 'release-source.json'), JSON.stringify({ files: snapshot() }, null, 2) + '\n');
    console.log('Release source manifest updated. Commit it with the reviewed changes.');
  } else { verify(); console.log('Release source matches the manifest.'); }
}
module.exports = { verify };
