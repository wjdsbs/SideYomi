# 로컬 사전 빌드 파이프라인

`public/dict-ko/jmdict-ko.json`(런타임 로컬 사전)을 만드는 빌드타임 스크립트.
익스텐션 번들에는 산출물(JSON)만 들어가고, 이 스크립트들은 들어가지 않는다.

## 산출물

- `public/dict-ko/jmdict-ko.json` — 최종 번들(커밋됨, gzip ~3.7MB)
  - 구조: `{ entries: { 표제어: [{ r, pos, meanings:[KO], examples:[{ja,ko}] }] }, readings: { 읽기: [표제어...] } }`
  - `readings`는 읽기(가나)→표제어 역인덱스. 런타임이 kuromoji `basic_form`(가나일 때多)으로도 조회하게 해 적중률 ~95%.

## 원본 데이터 (gitignore — 직접 받아야 함)

**JMdict (English, with examples)** — Yomitan 형식.

- 다운로드: https://github.com/yomidevs/jmdict-yomitan/releases/latest/download/JMdict_english_with_examples.zip
- 압축 풀어서 `scripts/raw/JMdict_english_with_examples/` 에 배치 (`index.json`, `tag_bank_*.json`, `term_bank_*.json`).
- 뜻=JMdict(영어), 예문=Tatoeba(JMdict examples판에 내장). 라이선스: `public/dict-ko/LICENSE` 참고.

kuromoji 토크나이저 사전은 별개로 `scripts/copy-dict.js`가 `public/dict`로 복사(postinstall).

## 실행 순서

```bash
# 1) 파싱 + 필터 → cache/jmdict-parsed.json (영어, ~54k 표제어)
#    필터: score ≥ 900,000 OR 예문 보유 (Yomitan score=빈도. 별도 빈도리스트 불필요)
node scripts/build-dict/parse.cjs --write

# 2) 번역 (Claude Haiku, Message Batches API) → data/translations.json
#    글로스(영어→KO, 일본어 원어 grounding) + 예문(일본어→KO). 캐시 기반이라 재실행하면 빠진 것만.
export ANTHROPIC_API_KEY=sk-ant-...        # PowerShell: $env:ANTHROPIC_API_KEY="..."
node scripts/build-dict/batch.cjs --dry    # (선택) 요청 미리보기, 과금 X
node scripts/build-dict/batch.cjs --limit 100   # (선택) 소량 품질검증
node scripts/build-dict/batch.cjs          # 전체. JSON 파싱 실패분 위해 "실패 0" 될 때까지 1~2회 반복
# 배치 제출 후 스크립트가 끊겼다면(과금됐는데 저장 못함):
node scripts/build-dict/batch.cjs --recover <batch_id>   # 결과만 회수, 재과금 X

# 3) 조립 → public/dict-ko/jmdict-ko.json (키 불필요)
node scripts/build-dict/build.cjs
```

## 파일 구조

- `cache/jmdict-parsed.json` — 중간물(raw에서 수초 재생성 가능). **gitignore**.
- `data/translations.json` — Claude 번역 결과(실비용 발생). **커밋**해서 보존 → 재과금 없이 재빌드.

## 주의

- 번역 모델/임계값 등은 각 스크립트 상단 상수(`MODEL`, `SCORE_MIN`, `PACK_G/E`)에서 조정.
