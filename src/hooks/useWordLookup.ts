import { useRef, useState } from 'react';
import { GroqClient } from '../api/GroqClient';
import { ChromeStorage } from '../api/ChromeStorage';
import { WordEntry } from '../models/WordEntry';
import type { JapaneseToken } from '../models/JapaneseToken';

export type LookupStatus = 'loading' | 'done' | 'no-key' | 'error';

export function useWordLookup() {
  const [status, setStatus] = useState<LookupStatus | null>(null);
  const [entry, setEntry] = useState<WordEntry | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const reqIdRef = useRef(0);

  const lookup = (token: JapaneseToken, context: string) => {
    setEntry(null);
    setError(undefined);

    reqIdRef.current += 1;
    const reqId = reqIdRef.current;

    ChromeStorage.getApiKey().then(async (apiKey) => {
      if (reqId !== reqIdRef.current) return;

      if (!apiKey) {
        setStatus('no-key');
        return;
      }

      const cache = await ChromeStorage.getWordCache();
      if (reqId !== reqIdRef.current) return;

      if (cache[token.cacheKey]) {
        setEntry(WordEntry.fromStored(cache[token.cacheKey]));
        setStatus('done');
        return;
      }

      setStatus('loading');
      try {
        const raw = await new GroqClient(apiKey).lookup(
          token.surface,
          token.reading ?? token.surface,
          context,
        );
        if (reqId !== reqIdRef.current) return;
        const result = new WordEntry(raw);
        setEntry(result);
        setStatus('done');
        ChromeStorage.setWordCache({ ...cache, [token.cacheKey]: result.toStorable() });
      } catch (err) {
        if (reqId !== reqIdRef.current) return;
        setError(err instanceof Error ? err.message : 'API 오류');
        setStatus('error');
      }
    });
  };

  const reset = () => {
    reqIdRef.current += 1;
    setStatus(null);
    setEntry(null);
    setError(undefined);
  };

  return { status, entry, error, lookup, reset };
}
