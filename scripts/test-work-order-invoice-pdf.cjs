const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js', 'utf8');
function extract(name) {
  const start = source.search(new RegExp('(?:async )?function ' + name + '\\('));
  return source.slice(start, source.indexOf('\n}', start) + 2);
}
const context = { currentRows: [], money: n => Number(n).toFixed(2),
  loadWorkOrderDraftDocument: async () => ({ wo_no: 'W08733', _draftAsset: {}, _parts: [{qty_needed:99}], _labor: [{hours:99}] }),
  actualLocationForWorkOrder: () => '', workOrderPdfPhotoGalleryHtml: () => '', paidInvoiceStampText: () => '',
  printableDocumentHtml: options => options,
};
vm.createContext(context);
vm.runInContext(['invoiceTotal','workOrderInvoicePrintableLine','printWorkOrderDraft'].map(extract).join('\n'), context);
(async () => {
  const invoice = { invoice_no:'W08733', notes:'Saved invoice', _lines:[
    {description:'PART - Saved part',unit:'Each',qty:1,rate:1016.60},
    {description:'Saved labor\nWork performed',unit:'Hour',qty:63,rate:200},
  ]};
  const result = await context.printWorkOrderDraft('W08733',{returnHtml:true,invoice});
  assert.equal(result.total,13616.60);
  assert.equal(result.lines.length,2);
  assert.equal(result.lines[1].cells[3],63);
  assert.equal(result.lines[1].detail,'Work performed');
  assert.equal(result.notes,'Saved invoice');
  assert.equal(result.title,'Customer Invoice');
  assert.equal(result.extraHtml,'');
  invoice._lines = [];
  const empty = await context.printWorkOrderDraft('W08733',{returnHtml:true,invoice});
  assert.equal(empty.total,0);
  assert.equal(empty.lines.length,0);
  console.log('PASS: invoice PDF uses saved lines and total, never current WO charges or labor summary');
})().catch(error => { console.error(error); process.exitCode=1; });
