const assert=require('node:assert/strict');
const {source,functions}=require('../source.cjs');
const scan=functions(['openAssetLocationModal']);
for(const key of ['Scanned equipment information','Equipment name','Make','Model','Serial #'])assert(scan.includes(key),key);
const journal=functions(['saveBalancedJournalModal']);assert(!journal.includes('isLockedAccountingDate(header.invoice_date)'), 'Invoice date must not select the posting period');
assert(journal.includes('isLockedAccountingDate(header.posting_date)'), 'Posting date must remain protected');
assert(source.includes('data-product-copy'));assert(source.includes('removeProductPhotoBtn'));assert(source.includes('data-asset-file="photo_url"'));
const receipt=functions(['saveGoodsReceiptModalOnce']);assert.equal((receipt.match(/await acceptReceivedWorkOrderParts\(/g)||[]).length,1);assert(!receipt.includes('await automaticallyIssueGoodsReceiptWorkOrderParts('),'Do not run both issue paths');
const labor=functions(['repairLaborEditTable']);assert(labor.includes('data-custom-column-order="1"'));
console.log('QR details, posting dates, photo/copy controls, single receipt acceptance and labor header alignment protected.');

