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
    <div className="flex items-center gap-1.5 px-3.5 py-[5px] text-[10.5px] text-ink-mute border-b border-rule-soft bg-paper-soft flex-none overflow-hidden">
      <span className="w-1.5 h-1.5 rounded-full bg-accent flex-none" />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1">{title}</span>
      {hostname && <span className="text-ink-faint flex-none">{hostname}</span>}
    </div>
  );
}
