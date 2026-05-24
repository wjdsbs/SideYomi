export type WordResult = {
  meanings: string[];
  pos: string;
};

const SYSTEM_PROMPT = `You are a Japanese-Korean dictionary assistant.
Given a Japanese word with its reading already provided, output ONLY a JSON object with its Korean meanings and part of speech.
Output format — JSON only, no explanation, no markdown:
{"meanings":["한국어 뜻1","한국어 뜻2"],"pos":"품사"}
Rules:
- meanings: standard Korean dictionary equivalents, max 4 items, most common meaning first
- pos: one of 명사/동사/형용사/부사/조사/표현
- Do NOT generate or modify the reading — it is already given.

Examples:
食べる たべる → {"meanings":["먹다"],"pos":"동사"}
高い たかい → {"meanings":["비싸다","높다"],"pos":"형용사"}
安い やすい → {"meanings":["싸다","저렴하다"],"pos":"형용사"}
学校 がっこう → {"meanings":["학교"],"pos":"명사"}`;

const userPrompt = (surfaceForm: string, reading: string, context: string) =>
  `단어: ${surfaceForm}
읽기: ${reading}
문맥: ${context}
위 단어의 한국어 뜻만 간결하게.`;

export async function lookupWord(
  surfaceForm: string,
  reading: string,
  context: string,
  apiKey: string,
): Promise<WordResult> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt(surfaceForm, reading, context) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq API error ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return JSON.parse(text) as WordResult;
}
