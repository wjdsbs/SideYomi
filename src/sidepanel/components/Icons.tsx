function Icon({
  size = 16,
  children,
  fill = 'none',
}: {
  size?: number;
  children: React.ReactNode;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: '0 0 auto' }}
    >
      {children}
    </svg>
  );
}

export function IconStar({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17.2 6.6 20l1.2-6L3.3 9.8l6.1-.7z" />
    </Icon>
  );
}
export function IconStarFill({ size }: { size?: number }) {
  return (
    <Icon size={size} fill="currentColor">
      <path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17.2 6.6 20l1.2-6L3.3 9.8l6.1-.7z" />
    </Icon>
  );
}
export function IconSpeaker({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 8c1.5 1 2.4 2.5 2.4 4S17.5 15 16 16" />
    </Icon>
  );
}
export function IconCopy({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </Icon>
  );
}
export function IconClose({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}
export function IconSearch({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </Icon>
  );
}
export function IconSettings({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </Icon>
  );
}
export function IconBook({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM4 17h14" />
    </Icon>
  );
}
export function IconClock({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}
export function IconExport({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />
    </Icon>
  );
}
export function IconPlus({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}
export function IconNote({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 4h16v12l-5 5H4zM15 21v-5h5" />
    </Icon>
  );
}
export function IconBack({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  );
}
export function IconSparkle({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </Icon>
  );
}
