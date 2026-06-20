import { useEffect, useRef, useState } from 'react';
import type { JapaneseToken } from '../../models/JapaneseToken';
import { cn } from '../../lib/cn';

type Range = { start: number; end: number };

type Props = {
  tokens: JapaneseToken[];
  selectedIdx: number | null;
  selectedRange: Range | null;
  showFurigana: boolean;
  showRomaji: boolean;
  onTokenClick: (idx: number) => void;
  onRangeSelect: (start: number, end: number) => void;
};

export function TokenFlow({
  tokens,
  selectedIdx,
  selectedRange,
  showFurigana,
  showRomaji,
  onTokenClick,
  onRangeSelect,
}: Props) {
  const anchorRef = useRef<number | null>(null);
  const focusRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const [preview, setPreview] = useState<Range | null>(null);

  // 토큰 영역 밖에서 마우스를 떼도 드래그를 마무리
  useEffect(() => {
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const a = anchorRef.current;
      const f = focusRef.current;
      setPreview(null);
      if (a !== null && f !== null && a !== f) {
        onRangeSelect(Math.min(a, f), Math.max(a, f));
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [onRangeSelect]);

  const handleMouseDown = (i: number) => {
    anchorRef.current = i;
    focusRef.current = i;
    draggingRef.current = true;
    didDragRef.current = false;
    setPreview({ start: i, end: i });
  };

  const handleMouseEnter = (i: number) => {
    if (!draggingRef.current || anchorRef.current === null) return;
    const a = anchorRef.current;
    focusRef.current = i;
    if (i !== a) didDragRef.current = true;
    setPreview({ start: Math.min(a, i), end: Math.max(a, i) });
  };

  const handleClick = (token: JapaneseToken, i: number) => {
    // 드래그 직후의 click 이벤트는 무시
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (!token.isPunctuation) onTokenClick(i);
  };

  const range = preview ?? selectedRange;
  const inRange = (i: number) => range !== null && i >= range.start && i <= range.end;

  return (
    <div className="relative">
      {(selectedIdx !== null || selectedRange !== null) && (
        <span className="absolute -left-2.5 top-1 bottom-1 w-0.5 bg-accent-line rounded opacity-60" />
      )}
      <div className="font-jp flex flex-wrap gap-x-0 items-end leading-[2.2] text-[17px] select-none">
        {tokens.map((token, i) => {
          // 줄바꿈 토큰: flex 줄을 채워 다음 토큰을 새 줄로 밀어낸다.
          // \n\n 등 빈 줄은 약간의 단락 간격을 준다.
          if (token.isLineBreak) {
            return (
              <span
                key={`${token.wordPosition}-br`}
                className={cn('basis-full', token.surface.length > 1 ? 'h-3' : 'h-0')}
              />
            );
          }

          const furigana = showFurigana ? token.furigana : null;
          const romaji = showRomaji && !token.isPunctuation ? token.romaji : null;
          const isParticle = token.pos === '助詞' || token.pos === '助動詞';
          const marked = selectedIdx === i || inRange(i);

          return (
            <button
              key={`${token.wordPosition}-${token.surface}`}
              type="button"
              onMouseDown={() => handleMouseDown(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              onClick={() => handleClick(token, i)}
              className={cn(
                'inline-flex flex-col items-center rounded-xs border-0 transition-[background,box-shadow] duration-[120ms]',
                token.isPunctuation
                  ? 'px-px py-[2px] pb-[3px] cursor-default'
                  : 'px-[3px] py-[2px] pb-[3px] cursor-pointer',
                marked
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
