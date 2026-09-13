const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js', 'utf8');
const fn = source.slice(source.indexOf('async function mergeTruckingReportJobsite('), source.indexOf('function printTruckingManagementReport('));
async function run({ owner = true, confirm = true, failAt = 0 } = {}) {
  const calls = [], messages = []; let reloads = 0;
  const button = { disabled: false, textContent: 'Edit jobsite' };
  const context = vm.createContext({
    isBryanOwner: () => owner, console: { error() {} },
    alert: message => messages.push(message), confirm: message => { messages.push(message); return confirm; },
    window: { location: { reload: () => reloads++ } },
    supabase: { rpc: async (name, args) => { calls.push({ name, args }); return calls.length === failAt ? { error: { message: 'Test failure' } } : { data: { records: 4, tables: { trucking_moves: 3, asset_locations: 1 }, merged: args.p_confirm } }; } }
  });
  vm.runInContext(fn, context);
  await context.mergeTruckingReportJobsite('Old', 'Retained', button);
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, 'Edit jobsite');
  return { calls, messages, reloads };
}
(async () => {
  let result = await run({ owner: false }); assert.equal(result.calls.length, 0);
  result = await run({ confirm: false }); assert.equal(result.calls.length, 1); assert.equal(result.calls[0].args.p_confirm, false); assert.equal(result.reloads, 0);
  result = await run({ failAt: 1 }); assert.equal(result.calls.length, 1); assert.equal(result.reloads, 0);
  result = await run({ failAt: 2 }); assert.equal(result.calls.length, 2); assert.equal(result.reloads, 0);
  result = await run(); assert.equal(result.calls.length, 2); assert.equal(result.calls[1].args.p_confirm, true); assert.equal(result.reloads, 1);
  assert.ok(result.messages.some(message => message.includes('ALL customers and ALL dates')));
  assert.match(source, /if \(selection\?\.merge\) return mergeTruckingReportJobsite/);
  assert.match(source, /data-jobsite-merge/);
  console.log('PASS: owner gate, preview, cancel, errors, explicit system-wide confirmation and successful refresh.');
})().catch(error => { console.error(error); process.exitCode = 1; });

