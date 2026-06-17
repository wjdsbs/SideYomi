import { cn } from '../../lib/cn';

type IconButtonProps = {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
  className?: string;
};

export function IconButton({
  children,
  label,
  onClick,
  active,
  badge,
  className,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'btn-icon rounded-sm',
        active ? 'text-accent bg-accent-soft' : 'text-ink-soft',
        className,
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-accent text-white text-[8.5px] px-1 rounded-full font-semibold min-w-3 h-3 flex items-center justify-center leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}
