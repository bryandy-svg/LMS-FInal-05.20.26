const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
function extract(name) {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  return end < 0 ? rest : rest.slice(0, end + 1);
}
const rates = [
  { service: 'Roll Off Bin', rate_type: 'Flat Rate', rate: 195 },
  { service: 'Dump Truck', rate_type: '/CY', rate: 12 },
  { service: 'Dump Truck', rate_type: '/Ton', rate: 25 },
  { service: 'Flat Rack', rate_type: 'Hourly', rate: 100 },
  { service: 'Green Waste', category: 'Tipping Fee', rate_type: '/CY', rate: 7, status: 'Inactive' },
  { service: 'Green Waste', category: 'Tipping Fee', rate_type: '/Ton', rate: 40 },
  { service: 'Green Waste', category: 'Tipping Fee', rate_type: '/CY', rate: 15 },
  { service: 'Concrete', category: 'Tipping Fee', rate_type: 'Per Ton', rate: 30 },
];
const fields = {};
const alerts = [];
const context = vm.createContext({
  productMeta: { truckingRates: rates },
  money: n => `$${Number(n).toFixed(2)}`,
  esc: s => String(s),
  truckingBillableHours: () => 2,
  truckingWorkedHours: () => 1,
  truckingToday: () => '2026-09-21',
  excelDateToIso: () => '2026-09-21',
  alert: message => alerts.push(message),
  modalBody: {
    querySelector: selector => fields[selector.match(/name="([^"]+)"/)?.[1]] || null,
    querySelectorAll: () => Object.entries(fields).map(([name, field]) => ({ name, value: field.value })),
  },
});
for (const name of ['isDumpTruckingService', 'truckingQuantity', 'truckingRateUnit', 'truckingRateForUnit', 'truckingDebrisRates', 'rankedTruckingSuggestOptions', 'truckingDebrisSuggestOptions', 'truckingTicketMaterialFields', 'syncTruckingTicketQuantity', 'truckingTicketMaterialError', 'manualTruckingRate', 'isRollOffEquipment', 'requiresTruckingCyTon', 'isTruckingTrainingEntry', 'manualFinalTicketCalculation', 'normalizeHeaderKey', 'truckingImportedDate', 'truckingImportedTime', 'finalizedTruckingUploadRecord', 'truckingTimeOrderError', 'saveManualTruckingTicketDraft', 'saveManualFinalTruckingTicket', 'saveAssignedDriverTask', 'finalizeAssignedDriverTask']) vm.runInContext(extract(name), context);
const error = context.truckingTicketMaterialError;
for (const service of ['Roll Off Bin', 'Dump Truck', 'End Dump', 'Flat Rack', 'Water Service', 'Training']) {
  assert.match(error({ service, debris_type: ' ' }), /Type of Debris is required/);
}
for (const cy_ton of ['12', '12 CY Ton', '-2 CY', '0 Ton', 'abc', '1e3 CY']) assert.match(error({ service: 'Dump Truck', debris_type: 'Green Waste', cy_ton }), /positive quantity/);
assert.equal(error({ service: 'Flat Rack', debris_type: 'Equipment' }), '');
assert.match(error({ service: 'Roll Off Bin', debris_type: 'Concrete', cy_ton: '5 CY' }), /No active tipping rate/);
assert.equal(context.manualTruckingRate('Dump Truck', 'Ton').rate, 25);
assert.equal(context.manualTruckingRate('Dump Truck', 'CY').rate, 12);
assert.equal(context.truckingRateUnit('Per CY'), 'CY');
assert.equal(context.truckingRateUnit('/ Ton'), 'Ton');
assert.deepEqual(Array.from(context.truckingDebrisSuggestOptions({ value: 'green cy' })), ['Green Waste']);
function set(values) {
  for (const key of Object.keys(fields)) delete fields[key];
  for (const [key, value] of Object.entries(values)) fields[key] = { value };
}
for (const [unit, quantity, serviceAmount, tippingCharge] of [['CY', 12, 144, 0], ['Ton', 4.5, 112.5, 0]]) {
  set({ service: 'Dump Truck', debris_type: 'Green Waste', debris_quantity: String(quantity), debris_unit: unit, cy_ton: '', worked_hours: '1', tipping_display: '', rate_display: '', amount: '' });
  context.syncTruckingTicketQuantity();
  assert.equal(fields.cy_ton.value, `${quantity} ${unit}`);
  const manual = context.manualFinalTicketCalculation();
  assert.equal(manual.serviceAmount, serviceAmount);
  assert.equal(manual.tippingCharge, tippingCharge);
  assert.equal(fields.tipping_display.value, '0.00');
  const upload = context.finalizedTruckingUploadRecord({ service: 'Dump Truck', equipment_used: 'Truck 1', type_of_debris: 'Green Waste', cy_ton: fields.cy_ton.value }, 'test', 'test.csv');
  assert.equal(upload.amount, serviceAmount);
  assert.equal(upload.tipping_charge, tippingCharge);
  assert.equal(upload.amount_to_bill, manual.total);
}
set({ service: 'Roll Off Bin', debris_type: 'Green Waste', cy_ton: '10 CY', worked_hours: '2' });
assert.equal(context.manualFinalTicketCalculation().total, 345);
const html = context.truckingTicketMaterialFields({ cy_ton: '4.5 Ton', debris_type: 'Green Waste' });
assert.match(html, /<select name="debris_type" required>/);
assert.match(html, /value="Green Waste" selected/);
assert.equal((html.match(/value="Green Waste"/g)||[]).length,1,'Unit-specific rates must not duplicate debris choices');
assert.match(context.truckingTicketMaterialFields({debris_type:'Legacy material'}),/Legacy material \(existing ticket value\)/);
assert.doesNotMatch(context.truckingTicketMaterialFields({}),/existing ticket value/);
assert.match(html, /value="Ton" selected/);
assert.match(html, /value="4.5"/);
assert.match(html, /name="debris_type"[^>]*required/);
(async () => {
  set({ start_time: '', end_time: '', debris_type: '' });
  await context.saveManualTruckingTicketDraft();
  assert.match(alerts.pop(), /Type of Debris is required/);
  set({ ticket_no: 'T1', move_date: '2026-09-21', driver_name: 'Driver', service: 'Flat Rack', equipment_label: 'Truck', customer: 'Customer', worked_hours: '2', debris_type: '' });
  context.truckingFindAsset = () => ({});
  context.isTruckingContainerEquipment = () => false;
  await context.saveManualFinalTruckingTicket();
  assert.match(alerts.pop(), /Type of Debris is required/);
  context.assignedDriverOperationalUpdate = () => ({ move_date: '2026-09-21', debris_type: '', standby_hours: 0 });
  await context.saveAssignedDriverTask({});
  assert.match(alerts.pop(), /Type of Debris is required/);
  set({ start_time: '10:00', end_time: '12:00' });
  context.assignedStandbyFitsClockTime = () => true;
  await context.finalizeAssignedDriverTask({ service: 'Flat Rack' });
  assert.match(alerts.pop(), /Type of Debris is required/);
  console.log('PASS: searchable debris; required debris for all services and four save paths; explicit positive CY/Ton; unit-matched active service/tipping rates; manual/upload totals; legacy unit rendering.');
})().catch(error => { console.error(error); process.exitCode = 1; });

for (const service of ['Dump Truck | 16 CY', 'End Dump', 'End-Dump Trailer']) {
  const fields = context.truckingTicketMaterialFields({service, debris_type:'Crushed coral', cy_ton:'16 CY'});
  assert.match(fields, /<input name="debris_type"/);
  assert.match(fields, /value="Crushed coral"/);
  assert.doesNotMatch(fields, /<select name="debris_type"/);
}
assert.match(context.truckingTicketMaterialFields({service:'Roll Off Service', equipment_label:'Dump Truck'}), /<select name="debris_type"/);
assert.equal(context.truckingTicketMaterialError({service:'Dump Truck',debris_type:'Crushed coral',cy_ton:'16 CY'}), '');
assert.match(context.truckingTicketMaterialError({service:'End Dump',debris_type:'',cy_ton:'16 CY'}), /required/);

assert.equal(context.truckingDebrisRates('Green Waste', {service:'Dump Truck'}).length, 0);
assert.equal(context.truckingDebrisRates('Green Waste', {service:'End Dump'}).length, 0);
