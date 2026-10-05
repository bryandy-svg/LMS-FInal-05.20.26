const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
const context = vm.createContext({ productMeta: { fuelTanks: [] }, esc: String });
for (const name of ['fuelPendingUsageVariance', 'fuelTankBalanceCards']) {
  const start = source.indexOf(`function ${name}(`);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(rest.slice(0, end + 1), context);
}
const row = (tank, balance, variance = 0) => ({ fuel_tank_id: tank, balance_after: balance, variance_gallons: variance });
assert.equal(context.fuelPendingUsageVariance([]), 0);
assert.equal(context.fuelPendingUsageVariance([row('a', 100), row('a', -20), row('a', -25)]), -25);
assert.equal(context.fuelPendingUsageVariance([row('a', -25), row('b', 100)]), -25, 'Other tanks cannot hide a deficit');
assert.equal(context.fuelPendingUsageVariance([row('a', -25), row('b', -10)]), -35);
assert.equal(context.fuelPendingUsageVariance([row('a', -25), row('a', 5)]), 0, 'Refill clears the pending deficit');
assert.equal(context.fuelPendingUsageVariance([row('a', -25), row('a', 0, -25)]), 0, 'Closing variance is not counted again as pending');
context.productMeta.fuelTanks = [{ asset_tag: 'TEST', current_balance: -25, balance_status: 'Active' }];
assert.match(context.fuelTankBalanceCards(), /Pending excess usage variance: -25.00 gal/);
context.productMeta.fuelTanks[0].current_balance = 25;
assert.doesNotMatch(context.fuelTankBalanceCards(), /Pending excess/);
assert.match(source, /Pending excess usage variance<\/span><strong>\$\{pendingVariance.toFixed\(2\)\}/);
console.log('PASS: pending variance, multiple tanks, refill, closure without double counting, and tank card display.');
