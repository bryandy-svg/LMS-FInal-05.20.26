const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js','utf8');
const dashed = { sku: '99996-6121', name: 'ELEC STARTER', source_vendor: 'KAWASAKI ENGINES', qty: 0 };
const plain = { sku: '999966121', name: 'ELEC STARTER', source_vendor: 'KAWASAKI ENGINES', qty: 3 };
const context = vm.createContext({ productMeta: { products: [dashed, plain] }, esc: value => String(value ?? '') });
for (const name of ['isSelectableProduct', 'normalizeProductLookupText', 'compactProductLookupText', 'productLookupQuery', 'productSuggestOptions', 'resolveProductLookup', 'productSuggestOptionMarkup']) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0);
  const rest = source.slice(start);
  const end = rest.slice(1).search(/\n(?:async )?function /);
  vm.runInContext(rest.slice(0, end + 1), context);
}
for (const products of [[dashed, plain], [plain, dashed]]) {
  context.productMeta.products = products;
  for (const expected of [dashed, plain]) {
    assert.equal(context.resolveProductLookup(expected.sku), expected);
    const options = context.productSuggestOptions({ value: expected.sku });
    assert.equal(options.length, 2);
    assert.equal(context.resolveProductLookup(options[0]), expected, 'Exact SKU must rank first');
    for (const option of options) {
      const product = option.startsWith(dashed.sku + ' - ') ? dashed : plain;
      assert.equal(context.resolveProductLookup(option), product, 'Selection must preserve identity');
      const markup = context.productSuggestOptionMarkup(option);
      assert.ok(markup.includes(`data-label="SKU">${product.sku}</span>`));
      assert.ok(markup.includes(`data-label="On Hand">${product.qty}</span>`));
    }
  }
}
context.productMeta.products = [dashed];
assert.equal(context.resolveProductLookup(plain.sku), dashed, 'Punctuation-tolerant fallback still works');
assert.equal(context.resolveProductLookup('unknown'), null);
console.log('PASS: exact SKU ranking, distinct dropdown rows, quantities and selected products in either load order; punctuation-tolerant fallback.');
