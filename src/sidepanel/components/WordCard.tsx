import type kuromoji from 'kuromoji';
import type { WordResult } from '../../lib/gemini';
import { toHiragana } from '../../lib/japanese';

type Token = kuromoji.IpadicFeatures;
type LookupStatus = 'loading' | 'done' | 'not-found' | 'no-key' | 'error';

type Props = {
  token: Token;
  result: WordResult | null;
  status: LookupStatus;
  error?: string;
};

export function WordCard({ token, result, status, error }: Props) {
  const reading = token.reading ? toHiragana(token.reading) : null;

  return (
    <div className="mt-3 border-t pt-3 space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-bold">{token.surface_form}</span>
        {reading && <span className="text-xs text-gray-400">{reading}</span>}
        {result && (
          <span className="text-[10px] bg-blue-50 text-blue-500 border border-blue-200 rounded px-1">
            {result.pos}
          </span>
        )}
      </div>

      {status === 'loading' && <p className="text-xs text-gray-400">검색 중...</p>}

      {status === 'no-key' && (
        <p className="text-xs text-gray-400">
          설정에서 Groq API 키를 입력하면 단어 뜻을 볼 수 있어요.
        </p>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-400">{error ?? 'API 오류가 발생했어요.'}</p>
      )}

      {status === 'done' && result && (
        <ol className="list-decimal list-inside space-y-0.5">
          {result.meanings.map((m) => (
            <li key={m} className="text-xs text-gray-700">
              {m}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
