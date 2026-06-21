import type { StoredWordResult } from './ChromeStorage';
import type { Translation } from '../types';

export type LookupRequest = {
  type: 'LOOKUP';
  surface: string;
  reading: string;
  context: string;
  cacheKey: string;
};

export type LookupResponse =
  | { ok: true; entry: StoredWordResult }
  | { ok: false; error: 'NO_KEY' | string };

export type TranslateRequest = {
  type: 'TRANSLATE';
  text: string;
  context: string;
  cacheKey: string;
};

export type TranslateResponse =
  | { ok: true; result: Translation }
  | { ok: false; error: 'NO_KEY' | string };
