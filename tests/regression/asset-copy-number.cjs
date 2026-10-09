const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('supabase-app/app.js','utf8');
const start=source.indexOf('async function nextAssetTagForType('),end=source.indexOf('\n}',start)+2;
let rows=[{asset_tag:'LMS-CO43',type:'Plate Compactor'},{asset_tag:'lms-co53',type:'Tamping Rammer'}];
const context=vm.createContext({productMeta:{assets:[]},currentRows:[],getAll:async(table,options)=>{assert.equal(table,'assets');assert.equal(options.strict,true);return rows;}});
vm.runInContext(source.slice(start,end),context);
(async()=>{
assert.equal(await context.nextAssetTagForType('Plate Compactor'),'LMS-CO54');
rows.push({asset_tag:'LMS-CO54',type:'Compactor'});
assert.equal(await context.nextAssetTagForType('Plate Compactor'),'LMS-CO55');
rows=[{asset_tag:'LMS-NT-007',type:'Other'}];
assert.equal(await context.nextAssetTagForType('New Type'),'LMS-NT-008');
context.getAll=async()=>{throw Error('offline');};
await assert.rejects(context.nextAssetTagForType('Plate Compactor'),/offline/);
assert.match(source,/const saveAsset = wasNew\s*\? \(row, columns, warning\) => insertOneWithOptionalColumns\("assets", row, columns, warning\)/);
console.log('PASS fresh numbering across types, filtered cache, new prefixes, read failure and insert-only creation');
})().catch(e=>{console.error(e);process.exitCode=1;});
