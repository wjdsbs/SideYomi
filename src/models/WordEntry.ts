import type { StoredWordResult } from '../api/ChromeStorage';
import type { JapaneseToken } from './JapaneseToken';
import type { Example } from '../types';

export class WordEntry {
  readonly reading: string | undefined;

  readonly meanings: string[];

  readonly pos: string;

  readonly examples: Example[];

  readonly related: string[];

  constructor(data: StoredWordResult) {
    this.reading = data.reading;
    this.meanings = data.meanings;
    this.pos = data.pos;
    this.examples = data.examples ?? [];
    this.related = data.related ?? [];
  }

  get primaryMeaning(): string {
    return this.meanings[0] ?? '';
  }

  toClipboardText(token: JapaneseToken): string {
    const reading = this.reading ?? token.reading ?? token.surface;
    return `${token.surface} (${reading}) — ${this.primaryMeaning}`;
  }

  toStorable(): StoredWordResult {
    return {
      ...(this.reading !== undefined && {
        reading: this.reading,
      }),
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
