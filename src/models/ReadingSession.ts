const MAX_WORDS = 8;

export class ReadingSession {
  constructor(private readonly words: string[] = []) {}

  push(word: string): ReadingSession {
    const deduped = this.words.filter((w) => w !== word);
    return new ReadingSession([word, ...deduped].slice(0, MAX_WORDS));
  }

  clear(): ReadingSession {
    return this.words.length === 0 ? this : new ReadingSession([]);
  }

  toList(): string[] {
    return this.words;
  }

  get length(): number {
    return this.words.length;
  }

  static empty(): ReadingSession {
    return new ReadingSession([]);
  }
}
