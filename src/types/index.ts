export type Source = { title: string; url: string };

export type Example = { jp: string; kr: string };

export type Translation = { translation: string; reading: string };

export type LookupStatus = 'idle' | 'loading' | 'done' | 'no-key' | 'error';

export type Bookmark = {
  word: string;
  reading: string;
  meaning: string;
  addedAt: number;
};

export type HistoryEntry = {
  word: string;
  reading: string;
  time: string;
  src: string;
};
