import type { StoredWordResult } from './ChromeStorage';

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
