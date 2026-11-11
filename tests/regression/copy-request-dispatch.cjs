const assert = require('node:assert/strict');
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
