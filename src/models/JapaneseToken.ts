import kuromoji from 'kuromoji';
import { toRomaji } from 'wanakana';

type RawToken = kuromoji.IpadicFeatures;

const NO_SPACE_POS = new Set(['助詞', '助動詞', '記号']);
const NO_SPACE_DETAIL = new Set(['接尾', '非自立']);

const hasKanji = (str: string) => /[一-鿿㐀-䶿]/.test(str);

const katakanaToHiragana = (str: string) =>
  str.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

export class JapaneseToken {
  constructor(private readonly raw: RawToken) {}

  get surface(): string {
    return this.raw.surface_form;
  }

  get reading(): string | null {
    return this.raw.reading ? katakanaToHiragana(this.raw.reading) : null;
  }

  // 사전 기본형(활용 이전). kuromoji가 모르면 '*' → 표면형으로 폴백.
  // 로컬 사전(표제어 키)을 활용형으로도 맞히기 위해 사용.
  get basicForm(): string {
    const b = this.raw.basic_form;
    return b && b !== '*' ? b : this.surface;
  }

  get pos(): string {
    return this.raw.pos;
  }

  get posDetail(): string {
    return this.raw.pos_detail_1;
  }

  get wordPosition(): number {
    return this.raw.word_position;
  }

  get isPunctuation(): boolean {
    return this.raw.pos === '記号';
  }

  // 줄바꿈 기호 토큰 — kuromoji가 원문의 \n을 記号로 보존한다.
  // 렌더 시 인라인 글자가 아니라 실제 줄바꿈으로 그리기 위한 판별.
  get isLineBreak(): boolean {
    return /\n/.test(this.surface);
  }

  get hasKanji(): boolean {
    return hasKanji(this.raw.surface_form);
  }

  // 후리가나: 한자가 포함된 토큰에만 표시
  get furigana(): string | null {
    return this.hasKanji && this.reading ? this.reading : null;
  }

  get romaji(): string {
    const reading = this.raw.reading ?? this.raw.surface_form;
    return toRomaji(reading);
  }

  // "表面|よみ" 형식의 캐시 키
  get cacheKey(): string {
    return `${this.surface}|${this.reading ?? this.surface}`;
  }

  // 전후 토큰을 받아 문맥 문자열 생성
  getContext(prev?: JapaneseToken, next?: JapaneseToken): string {
    return [prev?.surface, this.surface, next?.surface].filter(Boolean).join(' ');
  }

  // 로마자 표기 (전후 맥락에 따른 공백 포함)
  romajiWithSpacing(prev?: JapaneseToken): string {
    const reading = this.raw.reading ?? this.raw.surface_form;
    const needsSpace =
      prev !== undefined &&
      !NO_SPACE_POS.has(this.raw.pos) &&
      !NO_SPACE_DETAIL.has(this.raw.pos_detail_1) &&
      prev.raw.pos !== '接頭詞';
    return (needsSpace ? ' ' : '') + toRomaji(reading);
  }

  toRaw(): RawToken {
    return this.raw;
  }

  static fromRaw(raw: RawToken): JapaneseToken {
    return new JapaneseToken(raw);
  }

  static fromRawArray(raws: RawToken[]): JapaneseToken[] {
    return raws.map((r) => new JapaneseToken(r));
  }

  // 토큰 배열 전체의 로마자 표기
  static buildRomaji(tokens: JapaneseToken[]): string {
    return tokens.map((token, i) => token.romajiWithSpacing(tokens[i - 1])).join('');
  }
}
