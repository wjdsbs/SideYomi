import { useEffect, useState } from 'react';
import { ChromeStorage } from '../api/ChromeStorage';
import { Wordbook } from '../models/Wordbook';
import type { JapaneseToken } from '../models/JapaneseToken';
import type { WordEntry } from '../models/WordEntry';

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

  return { wordbook, addBookmark, removeBookmark, toggleBookmark };
}
