const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('supabase-app/app.js', 'utf8');
function functions(names) {
  return names.map(name => {
    const match = new RegExp('^(?:async )?function ' + name + '\\(', 'm').exec(source);
    assert(match, 'Missing application function: ' + name);
    const end = source.indexOf('\n}', match.index);
    assert(end > match.index, 'Could not extract ' + name);
    return source.slice(match.index, end + 2);
  }).join('\n');
}
module.exports = { source, functions };
