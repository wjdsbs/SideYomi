import type { JapaneseToken } from './JapaneseToken';

export type HistoryEntry = {
  word: string;
  reading: string;
  time: string;
  src: string;
};

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
    return this.entries.reduce<Record<string, HistoryEntry[]>>((acc, entry) => {
      const group = acc[entry.src];
      if (!group) {
        acc[entry.src] = [entry];
      } else {
        group.push(entry);
      }
      return acc;
    }, {});
  }

  get length(): number {
    return this.entries.length;
  }

  static empty(): ReadingHistory {
    return new ReadingHistory([]);
  }
}
