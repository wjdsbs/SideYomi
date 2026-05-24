import type { JapaneseToken } from '../../models/JapaneseToken';

type Props = {
  tokens: JapaneseToken[];
  selectedIdx: number | null;
  showFurigana: boolean;
  showRomaji: boolean;
  onTokenClick: (idx: number) => void;
};

export function TokenFlow({ tokens, selectedIdx, showFurigana, showRomaji, onTokenClick }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      {selectedIdx !== null && (
        <span
          style={{
            position: 'absolute',
            left: -10,
            top: 4,
            bottom: 4,
            width: 2,
            background: 'var(--accent-line)',
            borderRadius: 1,
            opacity: 0.6,
          }}
        />
      )}
      <div
        style={{
          fontFamily: 'var(--font-jp)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1px 0',
          alignItems: 'flex-end',
          lineHeight: 2.2,
          fontSize: 17,
        }}
      >
        {tokens.map((token, i) => {
          const furigana = showFurigana ? token.furigana : null;
          const romaji = showRomaji && !token.isPunctuation ? token.romaji : null;
          const isSelected = selectedIdx === i;

          return (
            <button
              key={`${token.wordPosition}-${token.surface}`}
              type="button"
              onClick={token.isPunctuation ? undefined : () => onTokenClick(i)}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: token.isPunctuation ? '2px 1px 3px' : '2px 3px 3px',
                borderRadius: 'var(--r-xs)',
                background: isSelected ? 'var(--mark)' : 'transparent',
                boxShadow: isSelected ? 'inset 0 -2px 0 var(--mark-line)' : 'none',
                cursor: token.isPunctuation ? 'default' : 'pointer',
                border: 'none',
                transition: 'background .12s, box-shadow .12s',
              }}
              onMouseEnter={(e) => {
                if (!token.isPunctuation && !isSelected) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--paper-sunk)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-jp-sans)',
                  fontSize: '0.55em',
                  color: 'var(--ink-mute)',
                  letterSpacing: '0.02em',
                  marginBottom: '0.15em',
                  minHeight: furigana ? undefined : '0.7em',
                  fontWeight: 400,
                }}
              >
                {furigana ?? ''}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-jp)',
                  fontWeight: 500,
                  color:
                    token.pos === '助詞' || token.pos === '助動詞'
                      ? 'var(--ink-mute)'
                      : 'var(--ink)',
                }}
              >
                {token.surface}
              </span>
              {romaji && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--ink-faint)',
                    marginTop: 2,
                    letterSpacing: '0.02em',
                  }}
                >
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
