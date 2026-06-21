// 최근 배치 상태 조회 (읽기 전용 — 제출/과금 없음). 새 터미널에서 실행.
// ANTHROPIC_API_KEY 필요.
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

(async () => {
  let n = 0;
  for await (const b of client.messages.batches.list({ limit: 10 })) {
    const c = b.request_counts || {};
    console.log(
      `${b.id}  [${b.processing_status}]  succeeded=${c.succeeded} processing=${c.processing} errored=${c.errored} canceled=${c.canceled} expired=${c.expired}`,
    );
    console.log(`   생성:${b.created_at}  종료:${b.ended_at || '-'}`);
    if (++n >= 10) break;
  }
  if (!n) console.log('배치 없음');
})().catch((e) => { console.error(e); process.exit(1); });
