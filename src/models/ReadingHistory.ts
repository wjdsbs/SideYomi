import type { JapaneseToken } from './JapaneseToken';
import type { WordEntry } from './WordEntry';
import type { HistoryEntry } from '../types';
import { groupBySrc } from '../lib/groupBySrc';

const MAX_ENTRIES = 50;

export class ReadingHistory {
  constructor(private readonly entries: HistoryEntry[] = []) {}

  push(token: JapaneseToken, entry: WordEntry, src: string): ReadingHistory {
    const item: HistoryEntry = {
      word: token.surface,
      reading: token.reading ?? token.surface,
      meaning: entry.primaryMeaning,
      examples: entry.examples,
      addedAt: Date.now(),
      src,
    };
    const deduped = this.entries.filter((e) => e.word !== token.surface);
    return new ReadingHistory([item, ...deduped].slice(0, MAX_ENTRIES));
  }

  toList(): HistoryEntry[] {
    return this.entries;
  }

  toStorable(): HistoryEntry[] {
    return this.entries;
  }

  groupedBySrc(): Record<string, HistoryEntry[]> {
    return groupBySrc(this.entries);
  }

  get length(): number {
    return this.entries.length;
  }

  static empty(): ReadingHistory {
    return new ReadingHistory([]);
  }
}
