const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
const products = ['Active', 'Inactive', 'Discontinued', 'Deactivated', '', 'Out'].map((status, index) => ({
  id: index + 1, sku: `PART-${index}`, name: 'Bearing', status, qty: 5,
  source_vendor: 'Vendor', _alternate_part_numbers: [`ALT-${index}`], _cross_reference_numbers: [`REF-${index}`],
}));
const inputs = {};
const context = vm.createContext({ productMeta: { products, assets: [], productAlternates: products.slice(1).map(p => ({ product_id: 1, alternate_sku: p.sku })) }, currentRows: products, productMasterTab: 'active', $: id => inputs[id] });
for (const name of ['isSelectableProduct', 'normalizeProductLookupText', 'compactProductLookupText', 'productLookupQuery', 'productSuggestOptions', 'resolveProductLookup', 'filteredProductRows', 'savedSalesAlternateProducts', 'rentalItemSuggestOptions']) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(rest.slice(0, end + 1), context);
}
assert.equal(context.productSuggestOptions({ value: 'Bearing' }).length, 3);
for (const p of products) {
  const active = ['', 'Active', 'Out'].includes(p.status);
  for (const query of [p.sku, p._alternate_part_numbers[0], p._cross_reference_numbers[0]]) {
    assert.equal(context.productSuggestOptions({ value: query }).length, active ? 1 : 0, query);
    assert.equal(context.resolveProductLookup(query), active ? p : null, query);
  }
}
assert.equal(context.filteredProductRows().length, 3);
context.productMasterTab = 'deactivated';
assert.equal(context.filteredProductRows().length, 3);
inputs.productSearch = { value: 'PART-1' };
assert.equal(context.filteredProductRows()[0], products[1]);
context.productMasterTab = 'active';
assert.equal(context.filteredProductRows().length, 0);
assert.equal(context.savedSalesAlternateProducts(products[0]).length, 2);
assert.equal(context.rentalItemSuggestOptions({ value: 'Bearing', dataset: {} }).length, 3);
assert.equal(context.productMeta.products.length, 6, 'Retain records for historical references');
console.log('PASS: active/deactivated tabs, SKU/name/vendor/alias search, exact entry, sales alternatives and rentals exclude deactivated parts.');
