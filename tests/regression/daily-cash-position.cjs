const assert=require('node:assert/strict'),vm=require('node:vm');const {functions}=require('../source.cjs');
const c={buildBankStatement:()=>({outstandingChecks:[{ledgerSource:'Check Run',amount:-100,num:'old'},{ledgerSource:'Transfer',amount:-20}]}),bankBookDisplayReference:r=>r.reference};vm.createContext(c);vm.runInContext(functions(['cashPositionPartyDescription','buildDailyCashPosition']),c);
const r=(date,debit,credit,source='Customer Payment',account='Cash')=>({posting_date:date,debit,credit,source,account});
const rows=[r('2026-10-19',0,100,'Check Run'),r('2026-10-20',200,0),r('2026-10-20',0,50,'Check Run'),r('2026-10-20',0,10,'Bank charge'),r('2026-10-21',50,0,'Check void'),r('2026-10-20',999,0,'Customer Payment','Other bank')];
const report=c.buildDailyCashPosition(rows,[],'Cash','2026-10-20','2026-10-22',1000);
assert.equal(report.days[0].beginning,900);assert.equal(report.days[0].ending,1040);assert.equal(report.days[0].checks,50);assert.equal(report.days[1].beginning,1090);assert.equal(report.days[1].ending,1090);assert.equal(report.days[2].ending,1090);assert.equal(report.outstanding.length,1);
assert.equal(c.buildDailyCashPosition(rows,[{amount:-100,tx_date:'2026-10-20'}],'Cash','2026-10-20','2026-10-20',1000).days[0].ending,1040,'Clearing is not a second deduction');
assert.throws(()=>c.buildDailyCashPosition(rows,[],'Cash','2026-10-22','2026-10-20',0));assert.throws(()=>c.buildDailyCashPosition(rows,[],'Cash','2026-02-30','2026-03-02',0));
const opening=c.buildDailyCashPosition([r('2026-10-20',100,0,'Beginning balance'),r('2026-10-20',0,20,'Check Run')],[],'Cash','2026-10-20','2026-10-20',0);assert.equal(opening.days[0].beginning,100);assert.equal(opening.days[0].ending,80);
console.log('Daily cash position checks passed');

assert.equal(report.outstandingTotal,100);
assert.equal(c.cashPositionPartyDescription({customer:'Customer A',description:'Payment batch'}),'Customer A');
assert.equal(c.cashPositionPartyDescription({vendor:'Vendor B',description:'Check run'}),'Vendor B');
assert.equal(c.cashPositionPartyDescription({customer:' ',vendor:' ',description:'Credit card payment'}),'Credit card payment');
assert.equal(c.cashPositionPartyDescription({reference:'PAY-1',posting_date:'2026-10-20',description:'Batch'},[{reference:'PAY-1',posting_date:'2026-10-20',customer:'Customer A'}]),'Customer A');
assert.equal(c.cashPositionPartyDescription({description:'Transfer'},[{customer:'Unrelated'}]),'Transfer');
const htmlContext={...c,esc:v=>String(v),money:v=>Number(v).toFixed(2),formatDisplayDate:v=>v};vm.createContext(htmlContext);vm.runInContext(functions(['dailyCashPositionHtml']),htmlContext);assert.match(htmlContext.dailyCashPositionHtml(report),/Total outstanding checks<\/th><th[^>]*>100.00/);

assert.doesNotMatch(htmlContext.dailyCashPositionHtml(report),/<tfoot/i, "Outstanding total must not repeat as a printed table footer");
assert.equal((htmlContext.dailyCashPositionHtml(report).match(/Total outstanding checks/g)||[]).length,1);

vm.runInContext(functions(['dailyCashPositionText']),htmlContext);
const copied=htmlContext.dailyCashPositionText(report);
assert.match(copied,/Daily Cash Position/);assert.match(copied,/Beginning cash .*900.00/);assert.match(copied,/Ending available cash: 1040.00/);assert.equal((copied.match(/Total outstanding checks:/g)||[]).length,1);assert.match(copied,/already deducted/);assert.match(copied,/2026-10-22/);

const simpleReport={...report,outstanding:[{date:'1999-01-01',num:'CHECK-HIDDEN',vendor:'Vendor Name',amount:-100}],days:[{...report.days[0],items:[{reference:'REF-HIDDEN',description:'Customer Name',category:'collections',amount:200}]}]};
for(const output of [htmlContext.dailyCashPositionHtml(simpleReport),htmlContext.dailyCashPositionText(simpleReport)]){assert.doesNotMatch(output,/CHECK-HIDDEN|REF-HIDDEN|1999-01-01|reference only/);assert.match(output,/Customer Name/);assert.match(output,/Vendor Name/);assert.match(output,/already deducted in the beginning cash balance/);assert.equal((output.match(/Total outstanding checks/g)||[]).length,1);}

const adjusted=c.buildDailyCashPosition([r('2026-10-21',7500,0,'Check Run Void'),r('2026-10-21',14673.5,0),r('2026-10-21',0,10000,'Manual Journal')],[],'Cash','2026-10-21','2026-10-22',26888.7);
assert.equal(adjusted.days[0].beginning,34388.7);
assert.equal(adjusted.days[0].receipts,0);
assert.equal(adjusted.days[0].ending,39062.2);
assert.equal(adjusted.days[1].beginning,39062.2);
assert.equal(adjusted.days[0].items.length,2,'Reversals included in opening must not repeat as activity');
const other=c.buildDailyCashPosition([r('2026-10-21',20,0,'Manual Journal Reversal'),r('2026-10-20',50,0,'Check Run Void')],[],'Cash','2026-10-21','2026-10-21',100);
assert.equal(other.days[0].beginning,150);
assert.equal(other.days[0].receipts,20,'Only check cancellation receipts move into opening');
for(const output of [htmlContext.dailyCashPositionHtml(adjusted),htmlContext.dailyCashPositionText(adjusted)]) {
 assert.match(output,/34388.70/);assert.match(output,/39062.20/);assert.match(output,/adjusted for cancelled checks/);
}
