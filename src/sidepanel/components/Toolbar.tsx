import { cn } from '../../lib/cn';

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
      className={cn(
        'inline-flex items-center gap-1 text-[11px] px-[9px] py-[3px] rounded-full font-medium cursor-pointer transition-all duration-150 font-ui border',
        active
          ? 'text-accent bg-accent-soft border-accent-line'
          : 'text-ink-mute bg-transparent border-rule',
      )}
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
    <div className="flex gap-1.5 px-3 py-1.5 items-center border-b border-rule-soft flex-none">
      <ToggleChip
        label="후리가나"
        active={showFurigana}
        onClick={onToggleFurigana}
        icon={<span className="font-jp-sans text-[9px]">ふ</span>}
      />
      <ToggleChip
        label="로마자"
        active={showRomaji}
        onClick={onToggleRomaji}
        icon={<span className="font-mono text-[9px]">A</span>}
      />
      <div className="flex-1" />
      <span className="text-[10.5px] text-ink-faint">{wordCount}어</span>
    </div>
  );
}
