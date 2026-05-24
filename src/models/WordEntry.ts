import type { StoredWordResult } from '../api/ChromeStorage';
import type { JapaneseToken } from './JapaneseToken';

export class WordEntry {
  readonly meanings: string[];

  readonly pos: string;

  readonly examples: { jp: string; kr: string }[];

  readonly related: string[];

  constructor(data: StoredWordResult) {
    this.meanings = data.meanings;
    this.pos = data.pos;
    this.examples = data.examples ?? [];
    this.related = data.related ?? [];
  }

  get primaryMeaning(): string {
    return this.meanings[0] ?? '';
  }

  toClipboardText(token: JapaneseToken): string {
    const reading = token.reading ?? token.surface;
    return `${token.surface} (${reading}) — ${this.primaryMeaning}`;
  }

  toStorable(): StoredWordResult {
    return {
      meanings: this.meanings,
      pos: this.pos,
      examples: this.examples,
      related: this.related,
    };
  }

  static fromStored(data: StoredWordResult): WordEntry {
    return new WordEntry(data);
  }
}
