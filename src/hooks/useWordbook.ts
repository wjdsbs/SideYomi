import { useEffect, useState } from 'react';
import { ChromeStorage } from '../api/ChromeStorage';
import { Wordbook } from '../models/Wordbook';
import type { JapaneseToken } from '../models/JapaneseToken';
import type { WordEntry } from '../models/WordEntry';
import type { Bookmark } from '../types';

export function useWordbook() {
  const [wordbook, setWordbook] = useState<Wordbook>(Wordbook.empty);

  useEffect(() => {
    ChromeStorage.getBookmarks().then((items) => setWordbook(new Wordbook(items)));
  }, []);

  const addBookmark = (token: JapaneseToken, entry: WordEntry) => {
    setWordbook((prev) => {
      const next = prev.add(token, entry);
      ChromeStorage.setBookmarks(next.toStorable());
      return next;
    });
  };

  const removeBookmark = (word: string) => {
    setWordbook((prev) => {
      const next = prev.remove(word);
      ChromeStorage.setBookmarks(next.toStorable());
      return next;
    });
  };

  const toggleBookmark = (token: JapaneseToken, entry: WordEntry | null) => {
    if (wordbook.has(token.surface)) {
      removeBookmark(token.surface);
    } else if (entry) {
      addBookmark(token, entry);
    }
  };

  // 최근 본 단어(HistoryEntry 등 완성된 레코드)를 단어장에 저장/해제 토글
  const toggleSave = (bookmark: Bookmark) => {
    setWordbook((prev) => {
      const next = prev.has(bookmark.word) ? prev.remove(bookmark.word) : prev.addRecord(bookmark);
      ChromeStorage.setBookmarks(next.toStorable());
      return next;
    });
  };

  return { wordbook, addBookmark, removeBookmark, toggleBookmark, toggleSave };
}
