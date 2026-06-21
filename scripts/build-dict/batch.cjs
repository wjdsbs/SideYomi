// Step 2(배치) — 고유 글로스/예문을 Claude Message Batches로 한국어 번역, 캐시 저장.
// 입력: cache/jmdict-parsed.json
// 출력: data/translations.json  { glosses:{sig:[["뜻"],...]}, examples:{ja:"번역"} }
// 모드:
//   --dry      : API 호출 없이 요청 개수·샘플만 출력 (키 불필요)
//   (기본)     : Batch 제출 → 폴링 → 결과 캐시 저장. ANTHROPIC_API_KEY 필요.
//   --limit N  : 앞쪽 N개 유닛만 (소량 실검증용)
const fs = require('fs');
const path = require('path');

const PARSED = path.resolve(__dirname, 'cache/jmdict-parsed.json');
const CACHE = path.resolve(__dirname, 'data/translations.json'); // 비싼 산출물 — 커밋 대상
const MODEL = 'claude-haiku-4-5';
const PACK_G = 10; // 글로스 항목/요청 (중첩 구조라 작게 → 응답 안정성↑)
const PACK_E = 30; // 예문 항목/요청

const DRY = process.argv.includes('--dry');
const recArg = process.argv.indexOf('--recover');
const RECOVER_ID = recArg >= 0 ? process.argv[recArg + 1] : null;
const limArg = process.argv.indexOf('--limit');
const LIMIT = limArg >= 0 ? Number(process.argv[limArg + 1]) : Infinity;

const GLOSS_SYS = `너는 일본어→한국어 사전 번역가다. 각 항목은 「일본어 단어」(읽기)와 그 JMdict 영어 뜻풀이(sense별)다.
의미 판단은 일본어 단어와 읽기를 우선 근거로 하고(영어가 모호하면 일본어 원어로 판정), 영어 뜻은 보조로만 참고하라.
각 sense를 자연스러운 한국어 사전 뜻 1~3개로 압축(영어 동의어를 1:1 나열 금지). 직역투·설명문 금지, 사전체.
출력은 JSON 배열만: [{"id":<번호>,"senses":[["뜻","뜻"],["다른 sense 뜻"]]}]`;
const EX_SYS = `너는 일본어→한국어 번역가다. 각 항목은 일본어 예문이다. 학습자가 이해하기 쉬운 자연스러운 한국어로, 직역투 지양, 결과만.
출력은 JSON 배열만: [{"id":<번호>,"ko":"번역"}]`;

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

function loadCache() {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  return { glosses: {}, examples: {} };
}

function collectUnits(dict, cache) {
  const gloss = new Map(); // sig -> senses(영어 글로스 배열)
  const ex = new Set();
  for (const term of Object.keys(dict)) {
    for (const e of dict[term]) {
      const sig = e.senses.map((s) => s.glosses.join(';')).join('|');
      // 대표 일본어 단어(term)+읽기(r)를 붙여 grounding. 같은 sig는 동의어이므로 KO 재사용 안전.
      if (!cache.glosses[sig] && !gloss.has(sig))
        gloss.set(sig, { senses: e.senses.map((s) => s.glosses), term, reading: e.r });
      for (const x of e.examples || []) if (!cache.examples[x.ja] && !ex.has(x.ja)) ex.add(x.ja);
    }
  }
  let g = [...gloss.entries()].map(([sig, v]) => ({ sig, ...v }));
  let e = [...ex];
  if (LIMIT !== Infinity) {
    g = g.slice(0, LIMIT);
    e = e.slice(0, LIMIT);
  }
  return { g, e };
}

// 청크 → Batch 요청 객체 + 로컬 id→키 매핑
function buildRequests(gChunks, eChunks) {
  const requests = [];
  const map = {}; // custom_id -> [키...]
  gChunks.forEach((items, ci) => {
    const id = `g${ci}`;
    map[id] = items.map((u) => u.sig);
    const body = items
      .map(
        (u, i) =>
          `[id ${i}] 「${u.term}」(${u.reading}) ${u.senses.map((g, si) => `${si + 1}. ${g.join('; ')}`).join(' / ')}`,
      )
      .join('\n');
    requests.push({
      custom_id: id,
      params: {
        model: MODEL,
        max_tokens: 8192,
        system: GLOSS_SYS,
        messages: [{ role: 'user', content: '번역:\n' + body }],
      },
    });
  });
  eChunks.forEach((items, ci) => {
    const id = `e${ci}`;
    map[id] = items;
    const body = items.map((ja, i) => `[id ${i}] ${ja}`).join('\n');
    requests.push({
      custom_id: id,
      params: {
        model: MODEL,
        max_tokens: 8192,
        system: EX_SYS,
        messages: [{ role: 'user', content: '번역:\n' + body }],
      },
    });
  });
  return { requests, map };
}

function parseArray(text) {
  const t = text.replace(/```json\s*|```/g, ''); // 코드펜스 제거
  const s = t.indexOf('['),
    e = t.lastIndexOf(']');
  if (s < 0 || e < 0) throw new Error('JSON 배열 없음');
  const body = t.slice(s, e + 1);
  try {
    return JSON.parse(body);
  } catch {
    return JSON.parse(body.replace(/,\s*([\]}])/g, '$1'));
  } // 트레일링 콤마 제거 후 재시도
}

async function main() {
  const dict = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
  const cache = loadCache();
  const { g, e } = collectUnits(dict, cache);
  const gChunks = chunk(g, PACK_G);
  const eChunks = chunk(e, PACK_E);
  const { requests, map } = buildRequests(gChunks, eChunks);

  console.log(
    `미번역 — 글로스 ${g.length} (요청 ${gChunks.length}), 예문 ${e.length} (요청 ${eChunks.length})`,
  );
  console.log(`총 배치 요청: ${requests.length}\n`);

  if (DRY) {
    console.log(
      '=== 샘플 요청(gloss) ===\n' + requests[0].params.messages[0].content.slice(0, 500),
    );
    if (eChunks.length)
      console.log(
        '\n=== 샘플 요청(example) ===\n' +
          requests[gChunks.length].params.messages[0].content.slice(0, 300),
      );
    console.log('\n(드라이런 — 제출 안 함)');
    return;
  }

  const Anthropic = require('@anthropic-ai/sdk');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY 필요');
    process.exit(1);
  }
  const client = new Anthropic();

  let batchId;
  if (RECOVER_ID) {
    const b = await client.messages.batches.retrieve(RECOVER_ID);
    console.log(`회수 모드 — ${RECOVER_ID} [${b.processing_status}]`);
    if (b.processing_status !== 'ended') {
      console.error('아직 ended 아님 — 나중에 다시 시도.');
      process.exit(1);
    }
    batchId = RECOVER_ID; // 재제출 안 함 = 재과금 없음
  } else {
    console.log('배치 제출 중...');
    const batch = await client.messages.batches.create({ requests });
    console.log('batch id:', batch.id);
    let b = batch;
    while (b.processing_status !== 'ended') {
      await new Promise((r) => setTimeout(r, 20000));
      b = await client.messages.batches.retrieve(batch.id);
      const c = b.request_counts;
      console.log(
        `  ...${b.processing_status} (완료 ${c.succeeded}/${c.processing + c.succeeded + c.errored})`,
      );
    }
    batchId = batch.id;
  }

  // 결과 수집 — 항목별 가드(null·형식오류 하나가 전체를 죽이지 않게)
  let ok = 0,
    fail = 0,
    skipped = 0;
  for await (const res of await client.messages.batches.results(batchId)) {
    try {
      if (res.result.type !== 'succeeded') {
        fail++;
        continue;
      }
      const keys = map[res.custom_id];
      if (!keys) {
        fail++;
        continue;
      }
      const isGloss = res.custom_id.startsWith('g');
      const text = res.result.message.content.find((x) => x.type === 'text')?.text ?? '';
      const arr = parseArray(text);
      for (const item of arr) {
        if (!item || item.id == null) {
          skipped++;
          continue;
        }
        const key = keys[item.id];
        if (key == null) {
          skipped++;
          continue;
        }
        if (isGloss) {
          if (!item.senses) {
            skipped++;
            continue;
          }
          cache.glosses[key] = item.senses;
        } else {
          if (item.ko == null) {
            skipped++;
            continue;
          }
          cache.examples[key] = item.ko;
        }
        ok++;
      }
    } catch {
      fail++;
    }
  }
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  console.log(`\n완료 — 저장 ${ok}, 항목스킵 ${skipped}, 요청실패 ${fail}. 캐시: ${CACHE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
