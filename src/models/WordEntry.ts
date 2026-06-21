import type { StoredWordResult } from '../api/ChromeStorage';
import type { JapaneseToken } from './JapaneseToken';
import type { Example, Origin } from '../types';

export class WordEntry {
  readonly meanings: string[];

  readonly pos: string;

  readonly examples: Example[];

  readonly related: string[];

  readonly origin: Origin;

  readonly reading: string | undefined;

  constructor(data: StoredWordResult) {
    this.meanings = data.meanings;
    this.pos = data.pos;
    this.examples = data.examples ?? [];
    this.related = data.related ?? [];
    this.origin = data.origin ?? 'ai';
    this.reading = data.reading;
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
      origin: this.origin,
    };
  }

  static fromStored(data: StoredWordResult): WordEntry {
    return new WordEntry(data);
  }
}
