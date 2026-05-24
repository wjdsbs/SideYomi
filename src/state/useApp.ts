import { useCallback, useReducer, useRef } from 'react';
import { appReducer, INITIAL_STATE } from './appReducer';
import type { AppState } from './appReducer';
import { tokenizerService } from '../api/TokenizerService';
import { ChromeStorage } from '../api/ChromeStorage';
import { GroqClient } from '../api/GroqClient';
import { JapaneseToken } from '../models/JapaneseToken';
import { WordEntry } from '../models/WordEntry';

function resolveSrc(source: AppState['source']): string {
  if (!source?.url) return 'この画面';
  try {
    return new URL(source.url).hostname;
  } catch {
    return source.url;
  }
}

export function useApp() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // 렌더마다 갱신 — async 콜백에서 최신 state 읽기용
  const stateRef = useRef(state);
  stateRef.current = state;

  const reqIdRef = useRef(0);

  const loadText = useCallback(async (text: string, source?: { title: string; url: string }) => {
    dispatch({ type: 'TEXT_LOADING', source });
    try {
      const raws = await tokenizerService.tokenize(text);
      dispatch({ type: 'TEXT_LOADED', tokens: JapaneseToken.fromRawArray(raws) });
    } catch {
      dispatch({ type: 'TEXT_LOAD_FAILED' });
    }
  }, []);

  const selectToken = useCallback(async (idx: number) => {
    const { tokens, selectedIdx, source } = stateRef.current;

    dispatch({ type: 'TOKEN_CLICKED', idx });

    // 같은 토큰 재클릭 → 해제, 조회 불필요
    if (selectedIdx === idx) return;

    const token = tokens[idx];
    if (!token || token.isPunctuation) return;

    // Stale-response guard
    reqIdRef.current += 1;
    const reqId = reqIdRef.current;

    const apiKey = await ChromeStorage.getApiKey();
    if (reqId !== reqIdRef.current) return;

    if (!apiKey) {
      dispatch({ type: 'LOOKUP_NO_KEY' });
      return;
    }

    const cache = await ChromeStorage.getWordCache();
    if (reqId !== reqIdRef.current) return;

    if (cache[token.cacheKey]) {
      dispatch({
        type: 'LOOKUP_DONE',
        entry: WordEntry.fromStored(cache[token.cacheKey]),
        token,
        src: resolveSrc(source),
      });
      return;
    }

    try {
      const prev = tokens[idx - 1];
      const next = tokens[idx + 1];
      const raw = await new GroqClient(apiKey).lookup(
        token.surface,
        token.reading ?? token.surface,
        token.getContext(prev, next),
      );
      if (reqId !== reqIdRef.current) return;
      const entry = new WordEntry(raw);
      dispatch({ type: 'LOOKUP_DONE', entry, token, src: resolveSrc(source) });
      ChromeStorage.setWordCache({ ...cache, [token.cacheKey]: entry.toStorable() });
    } catch (err) {
      if (reqId !== reqIdRef.current) return;
      dispatch({
        type: 'LOOKUP_FAILED',
        error: err instanceof Error ? err.message : 'API 오류',
      });
    }
  }, []);

  const clearSession = useCallback(() => dispatch({ type: 'SESSION_CLEARED' }), []);

  return { state, loadText, selectToken, clearSession };
}
