import { useEffect, useState } from 'react';
import kuromoji from 'kuromoji';
import { tokenize } from '../lib/kuromoji';
import { hasKanji, toHiragana, buildRomaji } from '../lib/japanese';
import { lookupWord } from '../lib/gemini';
import type { WordResult } from '../lib/gemini';
import { WordCard } from './components/WordCard';
import { Settings } from './components/Settings';

type Token = kuromoji.IpadicFeatures;
type Status = 'idle' | 'loading' | 'done' | 'error';
type LookupStatus = 'loading' | 'done' | 'no-key' | 'error';

function useLocalToggle(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(() =>
    localStorage.getItem(key) !== null ? localStorage.getItem(key) === 'true' : defaultValue,
  );
  const toggle = () =>
    setValue((v) => {
      localStorage.setItem(key, String(!v));
      return !v;
    });
  return [value, toggle] as const;
}

export default function App() {
  const [tab, setTab] = useState<'analyze' | 'settings'>('analyze');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [showFurigana, toggleFurigana] = useLocalToggle('showFurigana', true);
  const [showRomaji, toggleRomaji] = useLocalToggle('showRomaji', false);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [wordResult, setWordResult] = useState<WordResult | null>(null);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus | null>(null);
  const [lookupError, setLookupError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (message: { type: string; text: string }) => {
      if (message.type !== 'TEXT_SELECTED') return;
      setStatus('loading');
      setSelectedIdx(null);
      setWordResult(null);
      setLookupStatus(null);
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

  const handleTokenClick = (token: Token, idx: number) => {
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      setWordResult(null);
      setLookupStatus(null);
      return;
    }

    setSelectedIdx(idx);
    setWordResult(null);
    setLookupError(undefined);

    const reading = token.reading ? toHiragana(token.reading) : token.surface_form;
    const cacheKey = `${token.surface_form}|${reading}`;
    const prev = tokens[idx - 1]?.surface_form ?? '';
    const next = tokens[idx + 1]?.surface_form ?? '';
    const context = [prev, token.surface_form, next].filter(Boolean).join(' ');

    chrome.storage.local.get(['groqApiKey', 'wordCache'], ({ groqApiKey, wordCache }) => {
      if (!groqApiKey) {
        setLookupStatus('no-key');
        return;
      }

      const cache = (wordCache ?? {}) as Record<string, WordResult>;
      if (cache[cacheKey]) {
        setWordResult(cache[cacheKey]);
        setLookupStatus('done');
        return;
      }

      setLookupStatus('loading');
      lookupWord(token.surface_form, reading, context, groqApiKey)
        .then((result) => {
          setWordResult(result);
          setLookupStatus('done');
          chrome.storage.local.set({ wordCache: { ...cache, [cacheKey]: result } });
        })
        .catch((err: Error) => {
          setLookupError(err.message);
          setLookupStatus('error');
        });
    });
  };

  const romajiLine = tokens.length ? buildRomaji(tokens) : '';

  return (
    <div className="p-4 font-sans text-sm">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold">SideYomi</h1>
        <div className="flex gap-2">
          {tab === 'analyze' && (
            <>
              <button
                type="button"
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
                type="button"
                onClick={toggleRomaji}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  showRomaji
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'text-gray-400 border-gray-300'
                }`}
              >
                로마자
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setTab(tab === 'settings' ? 'analyze' : 'settings')}
            className="px-2 py-0.5 rounded text-xs border transition-colors text-gray-400 border-gray-300 hover:text-gray-600"
          >
            {tab === 'settings' ? '← 분석' : '설정'}
          </button>
        </div>
      </div>

      {tab === 'settings' && <Settings />}

      {tab === 'analyze' && status === 'idle' && (
        <p className="text-gray-400">텍스트를 선택하면 분석 결과가 여기에 표시됩니다.</p>
      )}

      {tab === 'analyze' && status === 'loading' && <p className="text-gray-400">분석 중...</p>}

      {tab === 'analyze' && status === 'error' && (
        <p className="text-red-500">분석 실패. 다시 시도해 주세요.</p>
      )}

      {tab === 'analyze' && status === 'done' && (
        <>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token, i) => {
              const furigana =
                showFurigana && hasKanji(token.surface_form) && token.reading
                  ? toHiragana(token.reading)
                  : null;
              return (
                <button
                  type="button"
                  key={`${token.word_position}-${token.surface_form}`}
                  onClick={() => handleTokenClick(token, i)}
                  className={`flex flex-col items-center rounded px-1 py-0.5 transition-colors cursor-pointer ${
                    selectedIdx === i ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs text-blue-400 min-h-[1em]">{furigana ?? ''}</span>
                  <span className="font-medium">{token.surface_form}</span>
                </button>
              );
            })}
          </div>

          {showRomaji && (
            <p className="mt-3 text-xs text-gray-500 border-t pt-2 leading-relaxed">{romajiLine}</p>
          )}

          {selectedIdx !== null && lookupStatus !== null && (
            <WordCard
              token={tokens[selectedIdx]}
              result={wordResult}
              status={lookupStatus}
              error={lookupError}
            />
          )}
        </>
      )}
    </div>
  );
}
