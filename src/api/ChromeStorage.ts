import type { Bookmark, Example, HistoryEntry, Translation } from '../types';

export type StoredWordResult = {
  meanings: string[];
  pos: string;
  examples?: Example[];
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

  static getTranslationCache(): Promise<Record<string, Translation>> {
    return new Promise((resolve) => {
      chrome.storage.local.get('translationCache', ({ translationCache }) => {
        resolve((translationCache as Record<string, Translation> | undefined) ?? {});
      });
    });
  }

  static setTranslationCache(cache: Record<string, Translation>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ translationCache: cache }, resolve);
    });
  }

  static getBookmarks(): Promise<Bookmark[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get('wordBookmarks', ({ wordBookmarks }) => {
        resolve((wordBookmarks as Bookmark[] | undefined) ?? []);
      });
    });
  }

  static setBookmarks(items: Bookmark[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ wordBookmarks: items }, resolve);
    });
  }

  static getHistory(): Promise<HistoryEntry[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get('wordHistory', ({ wordHistory }) => {
        resolve((wordHistory as HistoryEntry[] | undefined) ?? []);
      });
    });
  }

  static setHistory(items: HistoryEntry[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ wordHistory: items }, resolve);
    });
  }
}
