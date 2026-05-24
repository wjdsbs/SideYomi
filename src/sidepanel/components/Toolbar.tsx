type Props = {
  showFurigana: boolean;
  showRomaji: boolean;
  wordCount: number;
  onToggleFurigana: () => void;
  onToggleRomaji: () => void;
};

function ToggleChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        padding: '3px 9px',
        borderRadius: 999,
        color: active ? 'var(--accent)' : 'var(--ink-mute)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent-line)' : 'var(--rule)'}`,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all .15s',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function Toolbar({
  showFurigana,
  showRomaji,
  wordCount,
  onToggleFurigana,
  onToggleRomaji,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '6px 12px',
        alignItems: 'center',
        borderBottom: '1px solid var(--rule-soft)',
        flex: '0 0 auto',
      }}
    >
      <ToggleChip
        label="후리가나"
        active={showFurigana}
        onClick={onToggleFurigana}
        icon={<span style={{ fontFamily: 'var(--font-jp-sans)', fontSize: 9 }}>ふ</span>}
      />
      <ToggleChip
        label="로마자"
        active={showRomaji}
        onClick={onToggleRomaji}
        icon={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>A</span>}
      />
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{wordCount}어</span>
    </div>
  );
}
