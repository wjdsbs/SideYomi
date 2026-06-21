// Step 5 — 파싱본 + 번역캐시 → 최종 번들 public/dict-ko/jmdict-ko.json
// 구조: { entries: { 표제어: [{r,pos,meanings,examples?}] }, readings: { 읽기: [표제어...] } }
//   readings = 읽기(가나)→표제어 역인덱스. 런타임이 basic_form(가나일 때多)으로도 조회 가능 → 적중률 ~95%.
const fs = require('fs');
const path = require('path');

const PARSED = path.resolve(__dirname, 'cache/jmdict-parsed.json');
const CACHE = path.resolve(__dirname, 'data/translations.json');
const OUT_DIR = path.resolve(__dirname, '../../public/dict-ko');
const OUT = path.join(OUT_DIR, 'jmdict-ko.json');

if (!fs.existsSync(CACHE)) {
  console.error(`번역 캐시 없음: ${CACHE}\n먼저 batch.cjs로 번역하세요.`);
  process.exit(1);
}

const dict = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

const entries = {};
const readings = {};
const stats = { terms: 0, entries: 0, skippedNoGloss: 0, examples: 0, missingExTrans: 0 };

for (const term of Object.keys(dict)) {
  const arr = [];
  for (const e of dict[term]) {
    const sig = e.senses.map((s) => s.glosses.join(';')).join('|');
    const koSenses = cache.glosses[sig];
    if (!koSenses) { stats.skippedNoGloss++; continue; } // 뜻 번역 없으면 제외
    const meanings = [...new Set(koSenses.flat())]; // sense별 KO 평탄화·중복제거
    const out = { r: e.r, pos: e.pos, meanings };
    const exs = [];
    for (const x of e.examples || []) {
      const ko = cache.examples[x.ja];
      if (ko) { exs.push({ ja: x.ja, ko }); stats.examples++; } else stats.missingExTrans++;
    }
    if (exs.length) out.examples = exs;
    arr.push(out);
    stats.entries++;
  }
  if (!arr.length) continue;
  entries[term] = arr;
  stats.terms++;
  for (const e of arr) {
    if (e.r && e.r !== term) (readings[e.r] ||= []).push(term);
  }
}
// readings 중복 제거
for (const r of Object.keys(readings)) readings[r] = [...new Set(readings[r])];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ entries, readings }));
const mb = (fs.statSync(OUT).size / 1e6).toFixed(2);

console.log('=== 빌드 통계 ===');
console.log(stats);
console.log(`표제어 키 ${Object.keys(entries).length}, 읽기 키 ${Object.keys(readings).length}`);
console.log(`→ ${OUT} (${mb} MB)`);
if (stats.skippedNoGloss > 100) console.log(`⚠️ 뜻 번역 누락 ${stats.skippedNoGloss} — 번역 캐시가 불완전합니다.`);
