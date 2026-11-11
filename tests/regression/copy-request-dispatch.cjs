const assert = require('node:assert/strict');
const vm = require('node:vm');
const {functions} = require('../source.cjs');
const form = functions(['loadTruckingRequestForm']);
for (const [name, value] of [['requested_by', 'Ranee Rosario'], ['requestor_email', 'ranee@example.com']]) {
  const expression = form.match(new RegExp('name="' + name + '" value="\\$\\{esc\\((.*?)\\)\\}"'))[1];
  const evaluate = new Function('existing', 'copyMode', 'return ' + expression);
  assert.equal(evaluate({[name]: value}, true), value);
  assert.equal(evaluate(null, false), '');
}
assert.match(form, /Save as Unscheduled/);
assert.match(form, /Save &amp; Dispatch/);
assert.match(form, /!requestPortalIdentity && !usesTruckingRequestMobileView\(\) && canAccess\("trucking"\)/);
const save = functions(['saveTruckingRequest']);
assert.ok(save.indexOf('if (lineError) return') < save.indexOf('await openTruckingDispatchFromRequest(values.request_no)'));
assert.match(save, /if \(dispatchAfterSave\) await dispatchSelectedMoveRequests\(requests.map/);
assert.match(save, /values.status = existingRequest\?\.status \|\| "Requested"/);
const context = vm.createContext({});
vm.runInContext(functions(['truckingCopiedDispatchDefaults', 'truckingCopiedEquipment']), context);
const lines = [{line_no: 2, equipment_label: 'Excavator'}, {line_no: 4, equipment_label: 'Container', container_no: 'ABC'}];
const tickets = [
  {request_line_no: 2, move_date: '2026-11-01', driver_name: 'Old', equipment_label: 'Old truck'},
  {request_line_no: 2, move_date: '2026-11-02', driver_name: 'Jane', driver_email: 'jane@example.com', equipment_label: 'Lowboy'},
  {request_line_no: 4, move_date: '2026-11-02', driver_name: 'Jane', equipment_label: 'Sidelifter'},
  {request_line_no: 2, move_date: '2026-11-03', status: 'Cancelled', driver_name: 'Wrong', equipment_label: 'Wrong truck'}
];
const defaults = context.truckingCopiedDispatchDefaults(tickets, lines);
assert.equal(defaults.driver_name, 'Jane');
assert.equal(context.truckingCopiedEquipment(defaults, {line_no: 1, equipment_label: 'Excavator'}), 'Lowboy');
assert.equal(context.truckingCopiedEquipment(defaults, {container_no: 'ABC'}), 'Sidelifter');
assert.equal(context.truckingCopiedEquipment(defaults, {equipment_label: 'New item'}), '');
assert.equal(context.truckingCopiedDispatchDefaults([], lines, defaults), defaults);
assert.equal(context.truckingCopiedDispatchDefaults([], lines), null);
assert.ok(!('status' in defaults));
assert.match(save, /values.dispatch_defaults = dispatchDefaults/);
