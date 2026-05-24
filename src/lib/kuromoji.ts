import kuromoji from 'kuromoji';

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

let tokenizer: Tokenizer | null = null;
let initPromise: Promise<Tokenizer> | null = null;

function getTokenizer(): Promise<Tokenizer> {
  if (tokenizer) return Promise.resolve(tokenizer);
  if (initPromise) return initPromise;

  const dicPath = '/dict';
  console.log('[SideYomi] building tokenizer, dicPath:', dicPath);
  initPromise = new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, built) => {
      if (err) {
        console.error('[SideYomi] tokenizer build failed', err);
        initPromise = null;
        reject(err);
      } else {
        console.log('[SideYomi] tokenizer ready');
        tokenizer = built;
        resolve(built);
      }
    });
  });
  return initPromise;
}

export function tokenize(text: string): Promise<kuromoji.IpadicFeatures[]> {
  return getTokenizer().then((t) => t.tokenize(text));
}
