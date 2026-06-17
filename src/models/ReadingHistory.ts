import type { JapaneseToken } from './JapaneseToken';
import type { HistoryEntry } from '../types';
import { groupBySrc } from '../lib/groupBySrc';

const MAX_ENTRIES = 50;

export class ReadingHistory {
  constructor(private readonly entries: HistoryEntry[] = []) {}

  push(token: JapaneseToken, src: string): ReadingHistory {
    const entry: HistoryEntry = {
      word: token.surface,
      reading: token.reading ?? token.surface,
      time: '방금',
      src,
    };
    const deduped = this.entries.filter((e) => e.word !== token.surface);
    return new ReadingHistory([entry, ...deduped].slice(0, MAX_ENTRIES));
  }

  toList(): HistoryEntry[] {
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
