import { useEffect, useState } from 'react';
import kuromoji from 'kuromoji';
import { tokenize } from '../lib/kuromoji';
import { hasKanji, toHiragana, buildRomaji } from '../lib/japanese';

type Token = kuromoji.IpadicFeatures;
type Status = 'idle' | 'loading' | 'done' | 'error';

function useLocalToggle(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(
    () => localStorage.getItem(key) !== null
      ? localStorage.getItem(key) === 'true'
      : defaultValue
  );
  const toggle = () =>
    setValue((v) => {
      localStorage.setItem(key, String(!v));
      return !v;
    });
  return [value, toggle] as const;
}

export default function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [showFurigana, toggleFurigana] = useLocalToggle('showFurigana', true);
  const [showRomaji, toggleRomaji] = useLocalToggle('showRomaji', false);

  useEffect(() => {
    const handler = (message: { type: string; text: string }) => {
      if (message.type !== 'TEXT_SELECTED') return;
      setStatus('loading');
      tokenize(message.text)
        .then((result) => {
          setTokens(result);
          setStatus('done');
        })
        .catch((err) => {
          console.error('[SideYomi] tokenize error', err);
          setStatus('error');
        });
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const romajiLine = tokens.length ? buildRomaji(tokens) : '';

  return (
    <div className="p-4 font-sans text-sm">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold">SideYomi</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleFurigana}
            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
              showFurigana
                ? 'bg-blue-500 text-white border-blue-500'
                : 'text-gray-400 border-gray-300'
            }`}
          >
            후리가나
          </button>
          <button
            onClick={toggleRomaji}
            className={`px-2 py-0.5 rounded text-xs border transition-colors ${
              showRomaji
                ? 'bg-blue-500 text-white border-blue-500'
                : 'text-gray-400 border-gray-300'
            }`}
          >
            로마자
          </button>
        </div>
      </div>

      {status === 'idle' && (
        <p className="text-gray-400">텍스트를 선택하면 분석 결과가 여기에 표시됩니다.</p>
      )}

      {status === 'loading' && <p className="text-gray-400">분석 중...</p>}

      {status === 'error' && <p className="text-red-500">분석 실패. 다시 시도해 주세요.</p>}

      {status === 'done' && (
        <>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token, i) => {
              const furigana =
                showFurigana && hasKanji(token.surface_form) && token.reading
                  ? toHiragana(token.reading)
                  : null;
              return (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xs text-blue-400 min-h-[1em]">
                    {furigana ?? ''}
                  </span>
                  <span className="font-medium">{token.surface_form}</span>
                </div>
              );
            })}
          </div>

          {showRomaji && (
            <p className="mt-3 text-xs text-gray-500 border-t pt-2 leading-relaxed">
              {romajiLine}
            </p>
          )}
        </>
      )}
    </div>
  );
}
