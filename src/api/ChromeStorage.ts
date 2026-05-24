export type StoredBookmark = {
  word: string;
  reading: string;
  meaning: string;
  addedAt: number;
};

export type StoredWordResult = {
  meanings: string[];
  pos: string;
  examples?: { jp: string; kr: string }[];
  related?: string[];
};

export class ChromeStorage {
  static getApiKey(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get('groqApiKey', ({ groqApiKey }) => {
        resolve((groqApiKey as string | undefined) ?? null);
      });
    });
  }

  static getWordCache(): Promise<Record<string, StoredWordResult>> {
    return new Promise((resolve) => {
      chrome.storage.local.get('wordCache', ({ wordCache }) => {
        resolve((wordCache as Record<string, StoredWordResult> | undefined) ?? {});
      });
    });
  }

  static setWordCache(cache: Record<string, StoredWordResult>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ wordCache: cache }, resolve);
    });
  }

  static getBookmarks(): Promise<StoredBookmark[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get('wordBookmarks', ({ wordBookmarks }) => {
        resolve((wordBookmarks as StoredBookmark[] | undefined) ?? []);
      });
    });
  }

  static setBookmarks(items: StoredBookmark[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ wordBookmarks: items }, resolve);
    });
  }
}
