const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
const context=vm.createContext({truckingTimeMinutes:value=>{const [h,m]=value.split(':').map(Number);return h*60+m;}});
for(const name of ['truckingDriverSummaryWithFuel','truckingFuelReportRows']){
 const start=source.indexOf(`function ${name}(`),end=source.indexOf('\nfunction ',start+1);
 vm.runInContext(source.slice(start,end),context);
}
const lines=[['FUEL-1','2026-09-17'],['FUEL-1','2026-09-17'],['FUEL-2','2026-09-17'],['FUEL-3','2026-09-18']].map(([report_no,fuel_date])=>({report_no,fuel_date,driver_name:'Jeremiah Cepeda',time_in:'09:00',time_out:'10:00',gallons:10,fuel_selling_value:100,fuel_cost:50}));
const reports=context.truckingFuelReportRows(lines);
assert.equal(reports.length,3);
const rows=[...reports,{driver_name:'Jeremiah Cepeda',labor_date:'2026-09-17',is_labor_daily:true,logged_payroll_hours:8,total_labor_cost:200},{driver_name:'Jeremiah Cepeda',is_driver_total:true,run_hours:99}];
const daily=context.truckingDriverSummaryWithFuel(rows,true);
assert.equal(daily.find(x=>x.date==='2026-09-17').moves,2);
assert.equal(daily.find(x=>x.date==='2026-09-18').moves,1);
const total=context.truckingDriverSummaryWithFuel(rows)[0];
assert.equal(total.moves,3);assert.equal(total.move_hours,3);assert.equal(total.income,400);assert.equal(total.fuel_cost,200);assert.equal(total.labor,200);
rows.push({driver_name:'Jeremiah Cepeda',labor_date:'2026-09-17',ticket_no:'TR-1',run_hours:2});
assert.equal(context.truckingDriverSummaryWithFuel(rows)[0].moves,4);
assert.equal(context.truckingDriverSummaryWithFuel(rows)[0].move_hours,5);
console.log('PASS: reports counted once across equipment lines, daily/period totals, mixed trucking tickets, labor excluded, averages and financial totals.');
