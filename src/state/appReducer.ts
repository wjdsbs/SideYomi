import type { JapaneseToken } from '../models/JapaneseToken';
import type { WordEntry } from '../models/WordEntry';
import { ReadingHistory } from '../models/ReadingHistory';
import { ReadingSession } from '../models/ReadingSession';
import type { LookupStatus, Source } from '../types';

export type ReaderStatus = 'idle' | 'loading' | 'done' | 'error';

export type AppState = {
  readerStatus: ReaderStatus;
  tokens: JapaneseToken[];
  selectedIdx: number | null;
  session: ReadingSession;
  history: ReadingHistory;
  source: Source | null;
  lookup: { status: LookupStatus; entry: WordEntry | null; error?: string };
};

export type AppAction =
  | { type: 'TEXT_LOADING'; source?: Source }
  | { type: 'TEXT_LOADED'; tokens: JapaneseToken[] }
  | { type: 'TEXT_LOAD_FAILED' }
  | { type: 'TOKEN_CLICKED'; idx: number }
  | { type: 'LOOKUP_NO_KEY' }
  | { type: 'LOOKUP_DONE'; entry: WordEntry; token: JapaneseToken; src: string }
  | { type: 'LOOKUP_FAILED'; error: string }
  | { type: 'SESSION_CLEARED' };

const IDLE_LOOKUP: AppState['lookup'] = { status: 'idle', entry: null };
const LOADING_LOOKUP: AppState['lookup'] = { status: 'loading', entry: null };

export const INITIAL_STATE: AppState = {
  readerStatus: 'idle',
  tokens: [],
  selectedIdx: null,
  session: ReadingSession.empty(),
  history: ReadingHistory.empty(),
  source: null,
  lookup: IDLE_LOOKUP,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TEXT_LOADING':
      return {
        ...state,
        readerStatus: 'loading',
        tokens: [],
        selectedIdx: null,
        lookup: IDLE_LOOKUP,
        source: action.source ?? state.source,
      };

    case 'TEXT_LOADED':
      return { ...state, readerStatus: 'done', tokens: action.tokens };

    case 'TEXT_LOAD_FAILED':
      return { ...state, readerStatus: 'error' };

    case 'TOKEN_CLICKED':
      // 같은 토큰 재클릭 → 해제
      if (state.selectedIdx === action.idx) {
        return { ...state, selectedIdx: null, lookup: IDLE_LOOKUP };
      }
      return { ...state, selectedIdx: action.idx, lookup: LOADING_LOOKUP };

    case 'LOOKUP_NO_KEY':
      return { ...state, lookup: { status: 'no-key', entry: null } };

    case 'LOOKUP_DONE':
      return {
        ...state,
        lookup: { status: 'done', entry: action.entry },
        history: state.history.push(action.token, action.src),
        session: state.session.push(action.token.surface),
      };

    case 'LOOKUP_FAILED':
      return { ...state, lookup: { status: 'error', entry: null, error: action.error } };

    case 'SESSION_CLEARED':
      return { ...state, session: state.session.clear() };

    default:
      return state;
  }
}
