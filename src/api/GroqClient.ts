import type { StoredWordResult } from './ChromeStorage';
import type { Translation } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a Japanese-Korean dictionary assistant.
Given a Japanese word with its reading already provided, output ONLY a JSON object.
Output format — JSON only, no explanation, no markdown:
{"meanings":["뜻1"],"pos":"품사","examples":[{"jp":"예문","kr":"번역"}],"related":["관련어"]}
Rules:
- meanings: standard Korean equivalents, max 4, most common first
- pos: one of 명사/동사/형용사/부사/조사/표현
- examples: exactly 1 natural sentence a native speaker would actually say, using common collocations; avoid textbook clichés. Use [] for particles/auxiliaries/very short words
- related: 1 closely related Japanese word, or []
- Do NOT generate or modify the reading — it is already given.

Examples:
食べる たべる → {"meanings":["먹다"],"pos":"동사","examples":[{"jp":"今夜は外で食べることにした。","kr":"오늘 밤은 밖에서 먹기로 했다."}],"related":["食事"]}
高い たかい → {"meanings":["비싸다","높다"],"pos":"형용사","examples":[{"jp":"駅前のマンションは家賃が高い。","kr":"역 앞 맨션은 월세가 비싸다."}],"related":["安い"]}
学校 がっこう → {"meanings":["학교"],"pos":"명사","examples":[{"jp":"子どもたちが歩いて学校に通っている。","kr":"아이들이 걸어서 학교에 다니고 있다."}],"related":["大学"]}`;

const buildUserPrompt = (surfaceForm: string, reading: string, context: string) =>
  `단어: ${surfaceForm}\n읽기: ${reading}\n문맥: ${context}\n위 단어의 한국어 뜻만 간결하게.`;

const TRANSLATE_PROMPT = `You are a Japanese-Korean translator.
You are given a Japanese TEXT to translate and the surrounding sentence as CONTEXT. Output ONLY a JSON object.
Output format — JSON only, no explanation, no markdown:
{"translation":"완전한 한국어 번역","reading":"전체 히라가나 읽기"}
Rules:
- translation: translate the ENTIRE given text into natural Korean. Translate every clause through to the very end — NEVER omit, cut off, or stop early. Not word-by-word; idioms/compounds get the idiomatic meaning.
- reading: hiragana reading of the ENTIRE given text in this context. Use contextually correct readings (dates 6月→ろくがつ, 18日→じゅうはちにち; weekday 木→もく). Hiragana only; keep non-Japanese characters (numbers, punctuation) as-is.
- Use CONTEXT only to disambiguate meaning; always translate the full given TEXT, not the context.

Examples:
텍스트: レジかご / 문맥: レジかごサイズはお選びいただけます → {"translation":"계산대 장바구니","reading":"れじかご"}
텍스트: 6月18日 / 문맥: 6月18日（木）に大丸京都店をオープンいたします → {"translation":"6월 18일","reading":"ろくがつじゅうはちにち"}
`;

const buildTranslatePrompt = (text: string, context: string) =>
  `번역할 텍스트: ${text}\n전체 문맥: ${context}\n위 텍스트 전체를 처음부터 끝까지 빠짐없이 번역하고 정확한 읽기를 제공해 주세요.`;

function formatWait(seconds: number): string {
  const total = Math.ceil(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins > 0) return secs > 0 ? `약 ${mins}분 ${secs}초` : `약 ${mins}분`;
  return `약 ${secs}초`;
}

// 429 응답에서 재시도 대기 시간을 뽑아 한국어 안내 문구로 변환.
// 1) retry-after 헤더(초) 우선 → 2) 본문 "try again in 22m20.06s" 폴백 → 3) 시간 없는 일반 문구
function rateLimitMessage(retryAfter: string | null, body: string): string {
  let seconds = retryAfter ? Number(retryAfter) : NaN;
  if (!Number.isFinite(seconds)) {
    const m = body.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
    if (m) seconds = Number(m[1] ?? 0) * 60 + Number(m[2]);
  }
  if (Number.isFinite(seconds) && seconds > 0) {
    return `Groq 사용량 한도에 도달했어요. ${formatWait(seconds)} 후에 다시 시도해 주세요.`;
  }
  return 'Groq 사용량 한도에 도달했어요. 잠시 후 다시 시도해 주세요.';
}

export class GroqClient {
  constructor(private readonly apiKey: string) {}

  private async complete(
    systemPrompt: string,
    userPrompt: string,
    options: { temperature: number; maxTokens: number },
  ): Promise<unknown> {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      }),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      if (res.status === 429) {
        throw new Error(rateLimitMessage(res.headers.get('retry-after'), raw));
      }
      let message = `Groq API error ${res.status}`;
      try {
        message = (JSON.parse(raw) as { error?: { message?: string } })?.error?.message ?? message;
      } catch {
        /* JSON 아님 → 기본 메시지 유지 */
      }
      throw new Error(message);
    }

    const data = await res.json();
    const text =
      (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ??
      '';
    return JSON.parse(text);
  }

  async lookup(surfaceForm: string, reading: string, context: string): Promise<StoredWordResult> {
    return (await this.complete(SYSTEM_PROMPT, buildUserPrompt(surfaceForm, reading, context), {
      temperature: 0.35, // 예문 표현이 살아나도록 약간의 다양성 (JSON 형식은 유지)
      maxTokens: 512,
    })) as StoredWordResult;
  }

  async translate(text: string, context: string): Promise<Translation> {
    return (await this.complete(TRANSLATE_PROMPT, buildTranslatePrompt(text, context), {
      temperature: 0, // 번역은 정확·일관이 우선
      maxTokens: 2048,
    })) as Translation;
  }
}
