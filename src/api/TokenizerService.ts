import kuromoji from 'kuromoji';

type RawToken = kuromoji.IpadicFeatures;
type KuromojiTokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

class TokenizerService {
  private tokenizer: KuromojiTokenizer | null = null;

  private initPromise: Promise<KuromojiTokenizer> | null = null;

  private getTokenizer(): Promise<KuromojiTokenizer> {
    if (this.tokenizer) return Promise.resolve(this.tokenizer);
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: '/dict' }).build((err, built) => {
        if (err) {
          this.initPromise = null;
          reject(err);
        } else {
          this.tokenizer = built;
          resolve(built);
        }
      });
    });
    return this.initPromise;
  }

  tokenize(text: string): Promise<RawToken[]> {
    return this.getTokenizer().then((t) => t.tokenize(text));
  }
}

export const tokenizerService = new TokenizerService();
