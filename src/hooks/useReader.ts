import { useCallback, useState } from 'react';
import { tokenizerService } from '../api/TokenizerService';
import { JapaneseToken } from '../models/JapaneseToken';
import { ReadingSession } from '../models/ReadingSession';

export type ReaderStatus = 'idle' | 'loading' | 'done' | 'error';

const useLocalToggle = (key: string, defaultValue: boolean) => {
  const [value, setValue] = useState(() =>
    localStorage.getItem(key) !== null ? localStorage.getItem(key) === 'true' : defaultValue,
  );
  const toggle = () =>
    setValue((v) => {
      localStorage.setItem(key, String(!v));
      return !v;
    });
  return [value, toggle] as const;
};

export function useReader() {
  const [status, setStatus] = useState<ReaderStatus>('idle');
  const [tokens, setTokens] = useState<JapaneseToken[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [session, setSession] = useState<ReadingSession>(ReadingSession.empty);
  const [showFurigana, toggleFurigana] = useLocalToggle('showFurigana', true);
  const [showRomaji, toggleRomaji] = useLocalToggle('showRomaji', false);

  // useCallback으로 안정화 — App.tsx의 useEffect deps에 안전하게 포함 가능
  const load = useCallback((text: string) => {
    setStatus('loading');
    setSelectedIdx(null);
    tokenizerService
      .tokenize(text)
      .then((raws) => {
        setTokens(JapaneseToken.fromRawArray(raws));
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, []);

  const selectToken = useCallback((idx: number) => setSelectedIdx(idx), []);

  const deselectToken = useCallback(() => setSelectedIdx(null), []);

  const pushSession = useCallback((word: string) => {
    setSession((prev) => prev.push(word));
  }, []);

  const clearSession = useCallback(() => setSession(ReadingSession.empty()), []);

  const selectedToken = selectedIdx !== null ? (tokens[selectedIdx] ?? null) : null;

  const wordCount = tokens.filter((t) => !t.isPunctuation).length;

  return {
    status,
    tokens,
    selectedIdx,
    selectedToken,
    wordCount,
    session,
    showFurigana,
    showRomaji,
    load,
    selectToken,
    deselectToken,
    pushSession,
    clearSession,
    toggleFurigana,
    toggleRomaji,
  };
}
