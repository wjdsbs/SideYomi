import { IconClose } from './Icons';

type Props = {
  session: string[];
  onJump: (word: string) => void;
  onClear: () => void;
};

export function SessionStrip({ session, onJump, onClear }: Props) {
  if (session.length === 0) return null;
  return (
    <div
      style={{
        borderTop: '1px solid var(--rule)',
        background: 'var(--paper-soft)',
        padding: '7px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: '0 0 auto',
      }}
    >
      <span
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--ink-mute)',
          fontWeight: 600,
          flex: '0 0 auto',
        }}
      >
        이 세션
      </span>
      <div
        className="sy-scroll"
        style={{
          flex: 1,
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          minWidth: 0,
        }}
      >
        {session.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onJump(w)}
            style={{
              flex: '0 0 auto',
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid var(--rule)',
              background: 'var(--paper)',
              fontFamily: 'var(--font-jp)',
              fontSize: 12,
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              transition: 'all .12s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--paper-sunk)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--paper)';
            }}
          >
            {w}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        title="세션 비우기"
        style={{
          color: 'var(--ink-faint)',
          padding: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconClose size={11} />
      </button>
    </div>
  );
}
