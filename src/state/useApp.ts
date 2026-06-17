import { useCallback, useReducer, useRef } from 'react';
import { appReducer, INITIAL_STATE } from './appReducer';
import type { AppState } from './appReducer';
import { tokenizerService } from '../api/TokenizerService';
import type { LookupRequest, LookupResponse } from '../api/messages';
import type { Source } from '../types';
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

  const loadText = useCallback(async (text: string, source?: Source) => {
    dispatch(source !== undefined ? { type: 'TEXT_LOADING', source } : { type: 'TEXT_LOADING' });
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

    const prev = tokens[idx - 1];
    const next = tokens[idx + 1];

    const request: LookupRequest = {
      type: 'LOOKUP',
      surface: token.surface,
      reading: token.reading ?? token.surface,
      context: token.getContext(prev, next),
      cacheKey: token.cacheKey,
    };

    const response = (await chrome.runtime.sendMessage(request)) as LookupResponse;
    if (reqId !== reqIdRef.current) return;

    if (!response.ok) {
      if (response.error === 'NO_KEY') {
        dispatch({ type: 'LOOKUP_NO_KEY' });
      } else {
        dispatch({ type: 'LOOKUP_FAILED', error: response.error });
      }
      return;
    }

    const entry = new WordEntry(response.entry);
    dispatch({ type: 'LOOKUP_DONE', entry, token, src: resolveSrc(source) });
  }, []);

  const clearSession = useCallback(() => dispatch({ type: 'SESSION_CLEARED' }), []);

  return { state, loadText, selectToken, clearSession };
}
