import type { StoredWordResult } from './ChromeStorage';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a Japanese-Korean dictionary assistant.
Given a Japanese word and its context, output ONLY a JSON object.
Output format — JSON only, no explanation, no markdown:
{"reading":"よみがな","meanings":["뜻1"],"pos":"품사","examples":[{"jp":"예문","kr":"번역"}],"related":["관련어"]}
Rules:
- reading: correct hiragana reading for this word in this specific context. The tokenizer's suggested reading may be wrong — verify from context and correct if needed.
- meanings: standard Korean equivalents, max 4, most common first
- pos: one of 명사/동사/형용사/부사/조사/표현
- examples: 1-2 natural sentences using the word, or [] for particles/auxiliaries/very short words
- related: 1-3 related Japanese words, or []

Examples:
食べる (context: ご飯を食べる) → {"reading":"たべる","meanings":["먹다"],"pos":"동사","examples":[{"jp":"ご飯を食べる。","kr":"밥을 먹는다."}],"related":["飲む","食事"]}
間 (tokenizer says: ま, context: しばらくの間待つ) → {"reading":"あいだ","meanings":["사이","동안"],"pos":"명사","examples":[{"jp":"しばらくの間待った。","kr":"잠시 동안 기다렸다."}],"related":["時間","間隔"]}
人間 (context: 人間らしい生き方) → {"reading":"にんげん","meanings":["인간","사람"],"pos":"명사","examples":[{"jp":"人間らしく生きる。","kr":"인간답게 산다."}],"related":["人","生き物"]}`;

const buildUserPrompt = (surfaceForm: string, reading: string, context: string) =>
  `단어: ${surfaceForm}\n토크나이저 추정 읽기: ${reading}\n문맥: ${context}\n위 단어의 정확한 읽기와 한국어 뜻을 제공해 주세요.`;

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
