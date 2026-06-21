import { useCallback, useEffect, useReducer, useRef } from 'react';
import { appReducer, INITIAL_STATE } from './appReducer';
import type { AppState } from './appReducer';
import { tokenizerService } from '../api/TokenizerService';
import { localDictService } from '../api/LocalDictService';
import { ChromeStorage } from '../api/ChromeStorage';
import { ReadingHistory } from '../models/ReadingHistory';
import type {
  LookupRequest,
  LookupResponse,
  TranslateRequest,
  TranslateResponse,
} from '../api/messages';
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

// 문장 종결부호 + 줄바꿈 — 이 토큰 뒤에서 문장이 끊긴다고 본다
const SENTENCE_END = /[。！？!?…\n]/;

// 선택 범위[start,end]를 포함하는 문장과 그 앞뒤 한 문장씩을 문맥으로 추출.
// 문서 전체를 보내던 것을 ±1문장으로 줄여 토큰을 크게 절감한다.
function sentenceContext(tokens: JapaneseToken[], start: number, end: number): string {
  // 각 토큰을 문장 번호로 매핑 (종결부호 토큰 뒤에서 번호 증가)
  let s = 0;
  const sentenceOf = tokens.map((t) => {
    const cur = s;
    if (SENTENCE_END.test(t.surface)) s += 1;
    return cur;
  });
  const first = (sentenceOf[start] ?? 0) - 1;
  const last = (sentenceOf[end] ?? s) + 1;
  return tokens
    .filter((_, i) => {
      const si = sentenceOf[i] ?? 0;
      return si >= first && si <= last;
    })
    .map((t) => t.surface)
    .join('');
}

export function useApp() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // 렌더마다 갱신 — async 콜백에서 최신 state 읽기용
  const stateRef = useRef(state);
  stateRef.current = state;

  const reqIdRef = useRef(0);

  useEffect(() => {
    localDictService.load().catch(() => {
      /* 적재 실패 시 조회는 groq로 폴백 */
    });
  }, []);

  // 최근 본 단어 영속화: 마운트 시 1회 로드, 이후 변경마다 저장
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    ChromeStorage.getHistory().then((items) => {
      dispatch({ type: 'HISTORY_LOADED', history: new ReadingHistory(items) });
      historyLoadedRef.current = true;
    });
  }, []);
  useEffect(() => {
    // 로드 완료 전의 빈 초기값을 저장본에 덮어쓰지 않도록 가드
    if (!historyLoadedRef.current) return;
    ChromeStorage.setHistory(state.history.toStorable());
  }, [state.history]);

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

    // 로컬 사전 우선 — 적재돼 있으면 즉시(네트워크·API키 불필요). 미스면 groq로 폴백.
    try {
      await localDictService.load();
      if (reqId !== reqIdRef.current) return;
      const local = localDictService.lookup(token.surface, token.basicForm, token.reading);
      if (local) {
        dispatch({
          type: 'LOOKUP_DONE',
          entry: new WordEntry(local),
          token,
          src: resolveSrc(source),
        });
        return;
      }
    } catch {
      /* 적재 실패 → groq 폴백 */
    }

    const prev = tokens[idx - 1];
    const next = tokens[idx + 1];

    const request: LookupRequest = {
      type: 'LOOKUP',
      surface: token.surface,
      reading: token.reading ?? token.surface,
      context: token.getContext(prev, next),
      cacheKey: token.cacheKey,
    };

    let response: LookupResponse;
    try {
      response = (await chrome.runtime.sendMessage(request)) as LookupResponse;
    } catch {
      if (reqId !== reqIdRef.current) return;
      dispatch({
        type: 'LOOKUP_FAILED',
        error: '확장 연결이 끊겼어요. 페이지를 새로고침해 주세요.',
      });
      return;
    }
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

  const translateRange = useCallback(async (start: number, end: number) => {
    const { tokens } = stateRef.current;
    const text = tokens
      .slice(start, end + 1)
      .map((t) => t.surface)
      .join('');
    if (!text) return;

    // 문맥: 선택 문장 ±1문장만 전달해 토큰 절감 (문맥 의존 정확도는 거의 유지).
    // 문서 전체 선택이거나 문맥이 본문과 같으면 중복이므로 생략 → 캐시 적중률↑
    let context =
      start === 0 && end === tokens.length - 1 ? '' : sentenceContext(tokens, start, end);
    if (context === text) context = '';

    dispatch({ type: 'RANGE_SELECTED', start, end });

    // Stale-response guard (단어 조회와 공유)
    reqIdRef.current += 1;
    const reqId = reqIdRef.current;

    const request: TranslateRequest = {
      type: 'TRANSLATE',
      text,
      context,
      cacheKey: `${context}␟${text}`,
    };
    let response: TranslateResponse;
    try {
      response = (await chrome.runtime.sendMessage(request)) as TranslateResponse;
    } catch {
      if (reqId !== reqIdRef.current) return;
      dispatch({
        type: 'TRANSLATE_FAILED',
        error: '확장 연결이 끊겼어요. 페이지를 새로고침해 주세요.',
      });
      return;
    }
    if (reqId !== reqIdRef.current) return;

    if (!response.ok) {
      if (response.error === 'NO_KEY') {
        dispatch({ type: 'TRANSLATE_NO_KEY' });
      } else {
        dispatch({ type: 'TRANSLATE_FAILED', error: response.error });
      }
      return;
    }

    dispatch({ type: 'TRANSLATE_DONE', result: response.result });
  }, []);

  const translateAll = useCallback(() => {
    const { tokens } = stateRef.current;
    if (tokens.length === 0) return;
    translateRange(0, tokens.length - 1);
  }, [translateRange]);

  const clearTranslation = useCallback(() => dispatch({ type: 'TRANSLATION_CLOSED' }), []);

  return {
    state,
    loadText,
    selectToken,
    translateRange,
    translateAll,
    clearTranslation,
  };
}
