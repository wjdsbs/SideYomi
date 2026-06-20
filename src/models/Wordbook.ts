import type { Bookmark } from '../types';
import type { JapaneseToken } from './JapaneseToken';
import type { WordEntry } from './WordEntry';

export class Wordbook {
  // Map은 삽입 순서를 보장하므로 별도 정렬 불필요
  private readonly map: ReadonlyMap<string, Bookmark>;

  constructor(items: Bookmark[] = []) {
    this.map = new Map(items.map((b) => [b.word, b]));
  }

  get size(): number {
    return this.map.size;
  }

  has(word: string): boolean {
    return this.map.has(word);
  }

  add(token: JapaneseToken, entry: WordEntry): Wordbook {
    return this.addRecord({
      word: token.surface,
      reading: token.reading ?? token.surface,
      meaning: entry.primaryMeaning,
      examples: entry.examples,
      addedAt: Date.now(),
    });
  }

  // 완성된 Bookmark 레코드를 그대로 저장 (예: 최근 본 단어 → 단어장 승격)
  addRecord(bookmark: Bookmark): Wordbook {
    // 새로 추가된 항목이 앞에 오도록
    const ordered = [
      { ...bookmark, addedAt: Date.now() },
      ...this.toList().filter((b) => b.word !== bookmark.word),
    ];
    return new Wordbook(ordered);
  }

  remove(word: string): Wordbook {
    return new Wordbook(this.toList().filter((b) => b.word !== word));
  }

  toList(): Bookmark[] {
    return [...this.map.values()];
  }

  toExportText(): string {
    return this.toList()
      .map((b) => `${b.word}\t${b.reading}\t${b.meaning}`)
      .join('\n');
  }

  toStorable(): Bookmark[] {
    return this.toList();
  }

  static empty(): Wordbook {
    return new Wordbook([]);
  }
}
