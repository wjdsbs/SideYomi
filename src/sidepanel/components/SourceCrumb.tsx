type Props = {
  title: string;
  url: string;
};

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function SourceCrumb({ title, url }: Props) {
  const hostname = extractHostname(url);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 14px',
        fontSize: 10.5,
        color: 'var(--ink-mute)',
        borderBottom: '1px solid var(--rule-soft)',
        background: 'var(--paper-soft)',
        flex: '0 0 auto',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent)',
          flex: '0 0 auto',
        }}
      />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {title}
      </span>
      {hostname && <span style={{ color: 'var(--ink-faint)', flex: '0 0 auto' }}>{hostname}</span>}
    </div>
  );
}
