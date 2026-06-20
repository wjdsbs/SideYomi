import type { JapaneseToken } from '../models/JapaneseToken';
import type { WordEntry } from '../models/WordEntry';
import { ReadingHistory } from '../models/ReadingHistory';
import type { LookupStatus, Source, Translation } from '../types';

export type ReaderStatus = 'idle' | 'loading' | 'done' | 'error';

export type AppState = {
  readerStatus: ReaderStatus;
  tokens: JapaneseToken[];
  selectedIdx: number | null;
  selectedRange: { start: number; end: number } | null;
  history: ReadingHistory;
  source: Source | null;
  lookup: { status: LookupStatus; entry: WordEntry | null; error?: string };
  translation: { status: LookupStatus; result: Translation | null; error?: string };
};

export type AppAction =
  | { type: 'TEXT_LOADING'; source?: Source }
  | { type: 'TEXT_LOADED'; tokens: JapaneseToken[] }
  | { type: 'TEXT_LOAD_FAILED' }
  | { type: 'TOKEN_CLICKED'; idx: number }
  | { type: 'LOOKUP_NO_KEY' }
  | { type: 'LOOKUP_DONE'; entry: WordEntry; token: JapaneseToken; src: string }
  | { type: 'LOOKUP_FAILED'; error: string }
  | { type: 'RANGE_SELECTED'; start: number; end: number }
  | { type: 'TRANSLATE_NO_KEY' }
  | { type: 'TRANSLATE_DONE'; result: Translation }
  | { type: 'TRANSLATE_FAILED'; error: string }
  | { type: 'TRANSLATION_CLOSED' };

const IDLE_LOOKUP: AppState['lookup'] = { status: 'idle', entry: null };
const LOADING_LOOKUP: AppState['lookup'] = { status: 'loading', entry: null };
const IDLE_TRANSLATION: AppState['translation'] = { status: 'idle', result: null };
const LOADING_TRANSLATION: AppState['translation'] = { status: 'loading', result: null };

export const INITIAL_STATE: AppState = {
  readerStatus: 'idle',
  tokens: [],
  selectedIdx: null,
  selectedRange: null,
  history: ReadingHistory.empty(),
  source: null,
  lookup: IDLE_LOOKUP,
  translation: IDLE_TRANSLATION,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TEXT_LOADING':
      return {
        ...state,
        readerStatus: 'loading',
        tokens: [],
        selectedIdx: null,
        selectedRange: null,
        lookup: IDLE_LOOKUP,
        translation: IDLE_TRANSLATION,
        source: action.source ?? state.source,
      };

    case 'TEXT_LOADED':
      return { ...state, readerStatus: 'done', tokens: action.tokens };

    case 'TEXT_LOAD_FAILED':
      return { ...state, readerStatus: 'error' };

    case 'TOKEN_CLICKED':
      // 단어 모드 진입 → 번역 모드 해제
      // 같은 토큰 재클릭 → 해제
      if (state.selectedIdx === action.idx) {
        return { ...state, selectedIdx: null, lookup: IDLE_LOOKUP };
      }
      return {
        ...state,
        selectedIdx: action.idx,
        lookup: LOADING_LOOKUP,
        selectedRange: null,
        translation: IDLE_TRANSLATION,
      };

    case 'LOOKUP_NO_KEY':
      return { ...state, lookup: { status: 'no-key', entry: null } };

    case 'LOOKUP_DONE':
      return {
        ...state,
        lookup: { status: 'done', entry: action.entry },
        history: state.history.push(action.token, action.src),
      };

    case 'LOOKUP_FAILED':
      return { ...state, lookup: { status: 'error', entry: null, error: action.error } };

    case 'RANGE_SELECTED':
      // 번역 모드 진입 → 단어 모드 해제
      return {
        ...state,
        selectedRange: { start: action.start, end: action.end },
        translation: LOADING_TRANSLATION,
        selectedIdx: null,
        lookup: IDLE_LOOKUP,
      };

    case 'TRANSLATE_NO_KEY':
      return { ...state, translation: { status: 'no-key', result: null } };

    case 'TRANSLATE_DONE':
      return { ...state, translation: { status: 'done', result: action.result } };

    case 'TRANSLATE_FAILED':
      return { ...state, translation: { status: 'error', result: null, error: action.error } };

    case 'TRANSLATION_CLOSED':
      return { ...state, selectedRange: null, translation: IDLE_TRANSLATION };

    default:
      return state;
  }
}
