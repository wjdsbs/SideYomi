import type { HistoryEntry } from '../types';

export function groupBySrc(entries: HistoryEntry[]): Record<string, HistoryEntry[]> {
  return entries.reduce<Record<string, HistoryEntry[]>>((acc, entry) => {
    const group = acc[entry.src];
    if (!group) {
      acc[entry.src] = [entry];
    } else {
      group.push(entry);
    }
    return acc;
  }, {});
}
