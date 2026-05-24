import kuromoji from 'kuromoji';
import { toRomaji } from 'wanakana';

type Token = kuromoji.IpadicFeatures;

export const hasKanji = (str: string) => /[一-鿿㐀-䶿]/.test(str);

export const toHiragana = (str: string) =>
  str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const NO_SPACE_POS = new Set(['助詞', '助動詞', '記号']);
const NO_SPACE_DETAIL = new Set(['接尾', '非自立']);

export function buildRomaji(tokens: Token[]): string {
  return tokens
    .map((token, i) => {
      const prev = tokens[i - 1];
      const reading = token.reading ?? token.surface_form;
      const needsSpace =
        i > 0 &&
        !NO_SPACE_POS.has(token.pos) &&
        !NO_SPACE_DETAIL.has(token.pos_detail_1) &&
        prev.pos !== '接頭詞';
      return (needsSpace ? ' ' : '') + toRomaji(reading);
    })
    .join('');
}
