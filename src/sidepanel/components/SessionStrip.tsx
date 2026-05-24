import { IconClose } from './Icons';

type Props = {
  session: string[];
  onJump: (word: string) => void;
  onClear: () => void;
};

export function SessionStrip({ session, onJump, onClear }: Props) {
  if (session.length === 0) return null;
  return (
    <div className="border-t border-rule bg-paper-soft px-3 py-[7px] flex items-center gap-2 flex-none">
      <span className="text-[9px] uppercase tracking-[0.12em] text-ink-mute font-semibold flex-none">
        이 세션
      </span>
      <div className="sy-scroll flex-1 flex gap-1 overflow-x-auto min-w-0">
        {session.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onJump(w)}
            className="flex-none px-2 py-[2px] rounded-full border border-rule bg-paper font-jp text-xs text-ink-soft cursor-pointer transition-all duration-[120ms] hover:bg-paper-sunk"
          >
            {w}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        title="세션 비우기"
        className="text-ink-faint p-1 bg-transparent border-0 cursor-pointer flex items-center"
      >
        <IconClose size={11} />
      </button>
    </div>
  );
}
