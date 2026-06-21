import type { StoredWordResult } from './ChromeStorage';

// 빌드 번들(public/dict-ko/jmdict-ko.json) 구조.
// 예문은 번들에서 {ja,ko} 키 — 앱 Example 타입({jp,kr})으로 변환해 반환한다.
type RawEntry = {
  r: string;
  pos: string;
  meanings: string[];
  examples?: { ja: string; ko: string }[];
};
type Bundle = {
  entries: Record<string, RawEntry[]>;
  readings: Record<string, string[]>; // 읽기(가나) → 표제어[]
};

const DICT_URL = 'dict-ko/jmdict-ko.json';

function toStored(e: RawEntry): StoredWordResult {
  const result: StoredWordResult = {
    meanings: e.meanings,
    pos: e.pos,
    origin: 'local',
    reading: e.r,
  };
  if (e.examples?.length) result.examples = e.examples.map((x) => ({ jp: x.ja, kr: x.ko }));
  return result;
}

class LocalDictServiceImpl {
  private bundle: Bundle | null = null;

  private loading: Promise<void> | null = null;

  // 16MB 번들을 1회만 적재. 중복 호출은 같은 Promise를 공유.
  load(): Promise<void> {
    if (this.bundle) return Promise.resolve();
    if (!this.loading) {
      this.loading = fetch(chrome.runtime.getURL(DICT_URL))
        .then((res) => res.json())
        .then((data: Bundle) => {
          this.bundle = data;
        })
        .catch((err) => {
          this.loading = null; // 실패 시 재시도 허용
          throw err;
        });
    }
    return this.loading;
  }

  // 표제어/읽기로 엔트리 배열 조회 (basicForm 우선, 표면형·읽기 폴백).
  private entriesFor(key: string): RawEntry[] | null {
    const { bundle } = this;
    if (!bundle || !key) return null;
    const direct = bundle.entries[key];
    if (direct) return direct;
    const head = bundle.readings[key]?.find((h) => bundle.entries[h]);
    return head ? (bundle.entries[head] ?? null) : null;
  }

  // 로컬 사전 조회. 미스면 null → 호출자가 groq로 폴백.
  lookup(surface: string, basicForm: string, reading: string | null): StoredWordResult | null {
    if (!this.bundle) return null;
    const arr =
      this.entriesFor(basicForm) ?? this.entriesFor(surface) ?? this.entriesFor(reading ?? '');
    if (!arr || !arr.length) return null;
    // 같은 표제어에 여러 읽기/품사가 있으면 토큰 읽기와 일치하는 것을 우선.
    const e = (reading && arr.find((x) => x.r === reading)) || arr[0];
    return e ? toStored(e) : null;
  }
}

export const localDictService = new LocalDictServiceImpl();
