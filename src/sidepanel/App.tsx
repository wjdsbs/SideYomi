import { useEffect, useState } from 'react';
import kuromoji from 'kuromoji';
import { tokenize } from '../lib/kuromoji';

type Token = kuromoji.IpadicFeatures;
type Status = 'idle' | 'loading' | 'done' | 'error';

const hasKanji = (str: string) => /[一-鿿㐀-䶿]/.test(str);
const toHiragana = (str: string) =>
  str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

export default function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    const handler = (message: { type: string; text: string }) => {
      if (message.type !== 'TEXT_SELECTED') return;
      setStatus('loading');
      tokenize(message.text)
        .then((result) => {
          console.log('[SideYomi] tokenize success', result);
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

  return (
    <div className="p-4 font-sans text-sm">
      <h1 className="text-base font-bold mb-3">SideYomi</h1>

      {status === 'idle' && (
        <p className="text-gray-400">텍스트를 선택하면 분석 결과가 여기에 표시됩니다.</p>
      )}

      {status === 'loading' && <p className="text-gray-400">분석 중...</p>}

      {status === 'error' && <p className="text-red-500">분석 실패. 다시 시도해 주세요.</p>}

      {status === 'done' && (
        <div className="flex flex-wrap gap-2">
          {tokens.map((token, i) => {
            const furigana =
              hasKanji(token.surface_form) && token.reading
                ? toHiragana(token.reading)
                : null;
            return (
              <div key={i} className="flex flex-col items-center">
                <span className="text-xs text-gray-400">{furigana ?? ' '}</span>
                <span className="font-medium">{token.surface_form}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
