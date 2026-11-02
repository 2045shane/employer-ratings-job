const {test}=require('node:test');const assert=require('node:assert/strict');const {createHash}=require('node:crypto');const {gunzipSync}=require('node:zlib');const fs=require('node:fs');const path=require('node:path');
const s=require('../src/lib/sponsors');
const meta=require('../src/data/sponsors-meta.json');
const root=path.resolve(__dirname,'..');
function fixture(names){return {names,meta:{source:'GOV.UK Register of licensed sponsors: workers',sourceUrl:'https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers',csvUrl:'https://example.test/register.csv',csvDate:'2026-10-30',retrieved:'2026-11-02',route:'Skilled Worker',licenceName:'Open Government Licence v3.0'}};}
const sample=fixture(['NVIDIA Ltd','Google (UK) Limited','Amazon UK Services Ltd','Amazon Filters Ltd','Amazon Charitable Trust','Branos Oxford Ltd T/A Lilo','Lilo Ltd','Cafe Roma Ltd T/A Sunrise','Unilever UK Limited']);
function textOf(result){return s.formatSponsor(result).map(line=>line.text).join('\n');}

test('命中、未命中、多家无法判定',()=>{
 const hit=s.findSponsor('NVIDIA Ltd',sample);
 assert.equal(hit.status,'yes');assert.equal(hit.confidence,'high');assert.equal(hit.matchKind,'legal');assert.deepEqual(hit.matches,['NVIDIA Ltd']);
 assert.equal(hit.csvDate,'2026-10-30');assert.match(hit.source,/GOV\.UK/);
 const suffix=s.findSponsor('NVIDIA',sample);
 assert.equal(suffix.status,'yes');assert.equal(suffix.confidence,'high');
 const brand=s.findSponsor('Google',sample);
 assert.equal(brand.status,'yes');assert.equal(brand.confidence,'medium');assert.equal(brand.matchKind,'prefix');assert.deepEqual(brand.matches,['Google (UK) Limited']);
 const trading=s.findSponsor('Unilever',sample);
 assert.equal(trading.status,'yes');assert.equal(trading.confidence,'medium');
 const sunrise=s.findSponsor('Sunrise',sample);
 assert.equal(sunrise.status,'yes');assert.equal(sunrise.confidence,'high');assert.equal(sunrise.matchKind,'trading');assert.match(sunrise.matches[0],/Cafe Roma/);
 const exactTrade=s.findSponsor('Lilo',sample);
 assert.equal(exactTrade.status,'unknown');assert.equal(exactTrade.ambiguous,true);assert.equal(exactTrade.confidence,'low');assert.equal(exactTrade.matchCount,2);
 const fuzzy=s.findSponsor('Amazon',sample);
 assert.equal(fuzzy.status,'unknown');assert.equal(fuzzy.ambiguous,true);assert.equal(fuzzy.matchCount,3);assert.equal(fuzzy.confidence,'low');
 const one=s.findSponsor('Amazon Filters',sample);
 assert.equal(one.status,'yes');assert.equal(one.confidence,'high');assert.equal(one.matches[0],'Amazon Filters Ltd');
 const miss=s.findSponsor('Totally Missing Holdings',sample);
 assert.equal(miss.status,'no');assert.equal(miss.confidence,'none');assert.deepEqual(miss.matches,[]);assert.equal(miss.ambiguous,false);
 const noted=s.findSponsor('Totally Missing Holdings',sample,{'Totally Missing Holdings':{note:'只是备注',updated:'2026-11-02'}});
 assert.equal(noted.status,'no');assert.equal(noted.note,'只是备注');
 const lines=textOf(hit)+textOf(miss)+textOf(fuzzy);
 assert.match(lines,/在册：是/);assert.match(lines,/在册：否/);assert.match(lines,/无法判定/);assert.match(lines,/CSV 日期：2026-10-30/);assert.match(lines,/不是雇主评分/);
 assert.doesNotMatch(lines,/★|总评分|workLife|recommendPct|Glassdoor/);
 assert.equal(hit.overall,undefined);
});

test('备注 JSON 拒绝评分字段',()=>{
 assert.throws(()=>s.parseNotesJSON('{'),/非法 JSON/);
 assert.throws(()=>s.validateNotes({A:{overall:5,note:'x',updated:'2026-11-02'}}),/评分/);
 assert.throws(()=>s.validateNotes({A:{note:'',updated:'2026-11-02'}}));
 assert.throws(()=>s.validateNotes({A:{note:'x',updated:'2026-02-30'}}));
 assert.deepEqual(Object.keys(s.parseNotesJSON('{}')),[]);
 const saved=s.parseNotesJSON('{"Acme Ltd":{"note":"本地","updated":"2026-11-02"}}');
 assert.deepEqual(saved.acme,{note:'本地',updated:'2026-11-02'});
 assert.throws(()=>s.validateNotes({'A Inc.':{note:'x',updated:'2026-11-02'},A:{note:'y',updated:'2026-11-02'}}),/重复/);
});

test('打包的是 GOV.UK Skilled Worker 名册，不是示例评分',()=>{
 assert.equal(fs.existsSync(path.join(root,'src/data/sample-ratings.json')),false);
 const gz=fs.readFileSync(path.join(root,'src/data/sponsors-names.txt.gz'));
 const body=gunzipSync(gz).toString('utf8');
 assert.equal(createHash('sha256').update(body).digest('hex'),meta.sha256);
 const names=body.slice(0,-1).split('\n');
 assert.equal(names.length,meta.orgCount);assert.ok(names.length>10000);
 assert.equal(meta.route,'Skilled Worker');assert.match(meta.csvDate,/^\d{4}-\d{2}-\d{2}$/);
 assert.match(meta.source,/GOV\.UK Register of licensed sponsors: workers/);
 assert.match(meta.csvUrl,new RegExp(meta.csvDate+'\\.csv$'));
 assert.equal(meta.overall,undefined);
 assert.ok(names.includes('Google (UK) Limited'));assert.ok(names.includes('NVIDIA Ltd'));
 const register={meta,names};
 const hit=s.findSponsor('NVIDIA Ltd',register);
 assert.equal(hit.status,'yes');assert.equal(hit.confidence,'high');assert.equal(hit.csvDate,meta.csvDate);
 const google=s.findSponsor('Google',register);
 assert.equal(google.status,'yes');assert.equal(google.confidence,'medium');assert.equal(google.matches[0],'Google (UK) Limited');
 const amazon=s.findSponsor('Amazon',register);
 assert.equal(amazon.status,'unknown');assert.equal(amazon.ambiguous,true);assert.ok(amazon.matchCount>=3);
 const apple=s.findSponsor('Apple',register);
 assert.equal(apple.status,'unknown');assert.equal(apple.ambiguous,true);
 const miss=s.findSponsor('Totally Missing Holdings ZZ',register);
 assert.equal(miss.status,'no');assert.equal(miss.source,meta.source);
 const lines=textOf(hit);
 assert.match(lines,/GOV\.UK/);assert.doesNotMatch(lines,/★|总评分/);
});
