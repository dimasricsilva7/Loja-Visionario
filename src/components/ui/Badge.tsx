interface BadgeProps {
  label: string;
  color?: string | null;
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: color || "#1db954" }}
    >
      {label}
    </span>
  );
}
