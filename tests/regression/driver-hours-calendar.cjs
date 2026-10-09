const assert=require('node:assert/strict'),vm=require('node:vm');
const {functions}=require('../source.cjs');const c={Date};vm.createContext(c);vm.runInContext(functions(['driverHoursCalendarDates']),c);
let dates=c.driverHoursCalendarDates('2026-09');assert.equal(dates[0],'');assert.equal(dates[1],'2026-09-01');assert.equal(dates.at(-1),'2026-09-30');
assert.equal(c.driverHoursCalendarDates('2024-02').filter(Boolean).length,29);
assert.equal(c.driverHoursCalendarDates('2026-02').filter(Boolean).length,28);
assert.equal(c.driverHoursCalendarDates('2026-13').length,0);
const form=functions(['openManualTruckingPayrollHours']);assert.match(form,/saved\?\.total_hours/);assert.match(form,/calendarRow\(date, driver.name\)/);assert.match(form,/updateRow\(row, false\)/);assert.match(form,/truckingPayrollRecalculateRows\(records\)/);
console.log('Calendar month boundaries, saved-hour prefill and shared save path verified');
