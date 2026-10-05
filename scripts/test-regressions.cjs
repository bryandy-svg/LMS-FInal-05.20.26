const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
process.chdir(path.resolve(__dirname, '..'));
const suite = JSON.parse(fs.readFileSync('tests/regression-suite.json', 'utf8'));
let failures = 0;
for (const name of suite) {
  const result = spawnSync(process.execPath, ['tests/regression/' + name + '.cjs'], { encoding: 'utf8', timeout: 30000 });
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${name}`);
  if (result.status !== 0) { failures++; console.error(result.stdout, result.stderr, result.error?.message || ''); }
}
if (failures) process.exit(1);
console.log(`${suite.length} regression checks passed.`);
