import type { StoredWordResult } from './ChromeStorage';

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

export class GroqClient {
  constructor(private readonly apiKey: string) {}

  async lookup(surfaceForm: string, reading: string, context: string): Promise<StoredWordResult> {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(surfaceForm, reading, context) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
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
    return JSON.parse(text) as StoredWordResult;
  }
}
