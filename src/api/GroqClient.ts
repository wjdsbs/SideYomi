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
- examples: 1-2 natural sentences using the word, or [] for particles/auxiliaries/very short words
- related: 1-3 related Japanese words, or []
- Do NOT generate or modify the reading — it is already given.

Examples:
食べる たべる → {"meanings":["먹다"],"pos":"동사","examples":[{"jp":"ご飯を食べる。","kr":"밥을 먹는다."}],"related":["飲む","食事"]}
高い たかい → {"meanings":["비싸다","높다"],"pos":"형용사","examples":[{"jp":"この店は高い。","kr":"이 가게는 비싸다."}],"related":["安い","低い"]}
安い やすい → {"meanings":["싸다","저렴하다"],"pos":"형용사","examples":[{"jp":"このスーパーは安い。","kr":"이 마트는 싸다."}],"related":["高い"]}
学校 がっこう → {"meanings":["학교"],"pos":"명사","examples":[{"jp":"学校に行く。","kr":"학교에 가다."}],"related":["大学","教室"]}`;

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
텍스트: ピーチへの熱い想いにいくつかお返事もさせていただきます / 문맥: (동일) → {"translation":"피치를 향한 뜨거운 마음에 몇 가지 답변도 드리겠습니다","reading":"ぴーちへのあついおもいにいくつかおへんじもさせていただきます"}`;

const buildTranslatePrompt = (text: string, context: string) =>
  `번역할 텍스트: ${text}\n전체 문맥: ${context}\n위 텍스트 전체를 처음부터 끝까지 빠짐없이 번역하고 정확한 읽기를 제공해 주세요.`;

export class GroqClient {
  constructor(private readonly apiKey: string) {}

  private async complete(systemPrompt: string, userPrompt: string): Promise<unknown> {
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
        temperature: 0,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message ?? `Groq API error ${res.status}`,
      );
    }

    const data = await res.json();
    const text =
      (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ??
      '';
    return JSON.parse(text);
  }

  async lookup(surfaceForm: string, reading: string, context: string): Promise<StoredWordResult> {
    return (await this.complete(
      SYSTEM_PROMPT,
      buildUserPrompt(surfaceForm, reading, context),
    )) as StoredWordResult;
  }

  async translate(text: string, context: string): Promise<Translation> {
    return (await this.complete(
      TRANSLATE_PROMPT,
      buildTranslatePrompt(text, context),
    )) as Translation;
  }
}
