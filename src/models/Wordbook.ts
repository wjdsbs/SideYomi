import type { StoredBookmark } from '../api/ChromeStorage';
import type { JapaneseToken } from './JapaneseToken';
import type { WordEntry } from './WordEntry';

export class Wordbook {
  // Map은 삽입 순서를 보장하므로 별도 정렬 불필요
  private readonly map: ReadonlyMap<string, StoredBookmark>;

  constructor(items: StoredBookmark[] = []) {
    this.map = new Map(items.map((b) => [b.word, b]));
  }

  get size(): number {
    return this.map.size;
  }

  has(word: string): boolean {
    return this.map.has(word);
  }

  add(token: JapaneseToken, entry: WordEntry): Wordbook {
    const next = new Map(this.map);
    next.set(token.surface, {
      word: token.surface,
      reading: token.reading ?? token.surface,
      meaning: entry.primaryMeaning,
      addedAt: Date.now(),
    });
    // 새로 추가된 항목이 앞에 오도록
    const ordered = [
      next.get(token.surface)!,
      ...this.toList().filter((b) => b.word !== token.surface),
    ];
    return new Wordbook(ordered);
  }

  remove(word: string): Wordbook {
    return new Wordbook(this.toList().filter((b) => b.word !== word));
  }

  toList(): StoredBookmark[] {
    return [...this.map.values()];
  }

  toExportText(): string {
    return this.toList()
      .map((b) => `${b.word}\t${b.reading}\t${b.meaning}`)
      .join('\n');
  }

  toStorable(): StoredBookmark[] {
    return this.toList();
  }

  static empty(): Wordbook {
    return new Wordbook([]);
  }
}
