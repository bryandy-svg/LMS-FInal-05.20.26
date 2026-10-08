const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions,source}=require('../source.cjs');
const c=vm.createContext({Intl,Date});vm.runInContext(functions(['guamBusinessDate','dateAfterDays']),c);
for(const tz of ['UTC','Pacific/Guam','America/Los_Angeles']){
 process.env.TZ=tz;
 for(const [input,expected] of [['2026-10-07T23:30:00Z','2026-10-08'],['2026-10-07T13:59:59Z','2026-10-07'],['2026-10-07T14:00:00Z','2026-10-08'],['2026-12-31T14:00:00Z','2027-01-01'],['2028-02-28T14:00:00Z','2028-02-29']])assert.equal(c.guamBusinessDate(new Date(input)),expected,tz);
 assert.equal(c.dateAfterDays('2026-12-31',1),'2027-01-01');
}
assert.match(source,/const today = \(\) => guamBusinessDate\(\);/);
assert.match(source,/const localToday = \(\) => guamBusinessDate\(\);/);
assert.doesNotMatch(source,/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
console.log('PASS: Guam dates across UTC/Guam/mainland devices, midnight, year rollover, leap day and date-only arithmetic.');
