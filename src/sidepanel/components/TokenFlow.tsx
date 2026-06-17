import type { JapaneseToken } from '../../models/JapaneseToken';
import { cn } from '../../lib/cn';

type Props = {
  tokens: JapaneseToken[];
  selectedIdx: number | null;
  showFurigana: boolean;
  showRomaji: boolean;
  onTokenClick: (idx: number) => void;
};

export function TokenFlow({ tokens, selectedIdx, showFurigana, showRomaji, onTokenClick }: Props) {
  return (
    <div className="relative">
      {selectedIdx !== null && (
        <span className="absolute -left-2.5 top-1 bottom-1 w-0.5 bg-accent-line rounded opacity-60" />
      )}
      <div className="font-jp flex flex-wrap gap-x-0 items-end leading-[2.2] text-[17px]">
        {tokens.map((token, i) => {
          const isSelected = selectedIdx === i;
          const furigana = showFurigana ? token.furigana : null;
          const romaji = showRomaji && !token.isPunctuation ? token.romaji : null;
          const isParticle = token.pos === '助詞' || token.pos === '助動詞';

          return (
            <button
              key={`${token.wordPosition}-${token.surface}`}
              type="button"
              onClick={token.isPunctuation ? undefined : () => onTokenClick(i)}
              className={cn(
                'inline-flex flex-col items-center rounded-xs border-0 transition-[background,box-shadow] duration-[120ms]',
                token.isPunctuation
                  ? 'px-px py-[2px] pb-[3px] cursor-default'
                  : 'px-[3px] py-[2px] pb-[3px] cursor-pointer',
                isSelected
                  ? 'bg-mark shadow-[inset_0_-2px_0_var(--mark-line)]'
                  : !token.isPunctuation && 'hover:bg-paper-sunk',
              )}
            >
              <span
                className="font-jp-sans text-[0.55em] text-ink-mute tracking-[0.02em] mb-[0.15em] font-normal"
                style={{ minHeight: furigana ? undefined : '0.7em' }}
              >
                {furigana ?? ''}
              </span>
              <span
                className={cn('font-jp font-medium', isParticle ? 'text-ink-mute' : 'text-ink')}
              >
                {token.surface}
              </span>
              {romaji && (
                <span className="font-mono text-[9px] text-ink-faint mt-0.5 tracking-[0.02em]">
                  {romaji}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
