// Step 1 — JMdict(Yomitan v3) → 중간 JSON 파싱.
// 입력: scripts/raw/JMdict_english_with_examples/term_bank_*.json
// 출력(--write 시): scripts/build-dict/cache/jmdict-parsed.json
//   { 표제어: [ { r, pos, senses:[{glosses:[en...]}], examples:[{ja,en}] } ] }
const fs = require('fs');
const path = require('path');

const RAW = path.resolve(__dirname, '../raw/JMdict_english_with_examples');
const OUT_DIR = path.resolve(__dirname, 'cache');
const OUT = path.join(OUT_DIR, 'jmdict-parsed.json');
const WRITE = process.argv.includes('--write');
const EXAMPLE_CAP = 2;
// score ≥ SCORE_MIN(우선순위·빈도 상위) 이거나 예문 보유 엔트리만 채택.
// 읽기까지 런타임 인덱싱하면 이 ~54k 세트로 실문장 적중률 ~95%.
const SCORE_MIN = 900000;

// JMdict 품사 코드 → 한국어 표시용 대분류 (대표 태그만; 없으면 raw 유지)
const POS_MAP = [
  [/^v/, '동사'], [/^adj-i/, '형용사'], [/^adj-na/, '형용동사'],
  [/^adj/, '형용사'], [/^adv/, '부사'], [/^n/, '명사'],
  [/^pn/, '대명사'], [/^prt/, '조사'], [/^conj/, '접속사'],
  [/^int/, '감탄사'], [/^exp/, '표현'], [/^aux/, '조동사'],
  [/^pref/, '접두사'], [/^suf/, '접미사'], [/^ctr/, '조수사'],
];
function mapPos(defTags) {
  // 다의어 분리 엔트리는 defTags 앞에 sense 번호가 붙는다("1 n vs vi") → 숫자 토큰 제거
  const first = (defTags || '').split(/\s+/).filter((t) => !/^\d+$/.test(t))[0];
  for (const [re, label] of POS_MAP) if (re.test(first || '')) return label;
  return first || '';
}

// structured-content 노드에서 평문 텍스트만 재귀 추출
function plainText(node) {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(plainText).join('');
  if (typeof node === 'object') return plainText(node.content);
  return '';
}

// content 트리를 돌며 data.content === marker 인 ul 노드들을 수집
function collectByMarker(node, marker, out) {
  if (Array.isArray(node)) {
    for (const n of node) collectByMarker(n, marker, out);
  } else if (node && typeof node === 'object') {
    if (node.data && node.data.content === marker) out.push(node);
    else collectByMarker(node.content, marker, out);
  }
  return out;
}

// glossary ul 하나 = 한 sense. li 자식들의 텍스트 = glosses
function sensesFrom(sc) {
  const uls = collectByMarker(sc, 'glossary', []);
  return uls
    .map((ul) => {
      const lis = Array.isArray(ul.content) ? ul.content : [ul.content];
      const glosses = lis.map((li) => plainText(li).trim()).filter(Boolean);
      return { glosses };
    })
    .filter((s) => s.glosses.length);
}

// examples ul: li 순회 — lang!=="en" 이면 새 예문(ja), lang==="en"이면 직전 예문의 en
function examplesFrom(sc) {
  const uls = collectByMarker(sc, 'examples', []);
  const out = [];
  for (const ul of uls) {
    const lis = Array.isArray(ul.content) ? ul.content : [ul.content];
    let cur = null;
    for (const li of lis) {
      const text = plainText(li).trim();
      if (!text) continue;
      if (li.lang === 'en') {
        if (cur && !cur.en) cur.en = text;
      } else {
        cur = { ja: text, en: '' };
        out.push(cur);
      }
      if (out.length >= EXAMPLE_CAP && cur && cur.en) return out.slice(0, EXAMPLE_CAP);
    }
  }
  return out.slice(0, EXAMPLE_CAP);
}

function isStructured(def) {
  return Array.isArray(def) && def[0] && typeof def[0] === 'object' && def[0].type === 'structured-content';
}

const dict = {};
const stats = { banks: 0, entries: 0, formsSkipped: 0, belowCutoff: 0, headwords: 0, withExamples: 0, totalExamples: 0 };

const banks = fs.readdirSync(RAW).filter((f) => /^term_bank_\d+\.json$/.test(f));
for (const bank of banks) {
  const rows = JSON.parse(fs.readFileSync(path.join(RAW, bank), 'utf8'));
  stats.banks++;
  for (const row of rows) {
    const [term, reading, defTags, , score, def] = row;
    if (!isStructured(def)) { stats.formsSkipped++; continue; } // "forms" 별칭 등
    const senses = sensesFrom(def);
    if (!senses.length) continue;
    const examples = examplesFrom(def);
    if (score < SCORE_MIN && !examples.length) { stats.belowCutoff++; continue; }
    const entry = { r: reading || term, pos: mapPos(defTags), senses };
    if (examples.length) entry.examples = examples;
    (dict[term] ||= []).push(entry);
    stats.entries++;
    if (examples.length) { stats.withExamples++; stats.totalExamples += examples.length; }
  }
}
stats.headwords = Object.keys(dict).length;

console.log('=== 파싱 통계 ===');
console.log(stats);

console.log('\n=== 샘플 3종 ===');
for (const key of ['サボる', '頼る', '奮発']) {
  console.log(`\n[${key}]`);
  console.log(JSON.stringify(dict[key], null, 1));
}

if (WRITE) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(dict));
  console.log(`\n→ 저장: ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
} else {
  console.log('\n(드라이런 — 저장 안 함. 확인되면 --write 로 실행)');
}
