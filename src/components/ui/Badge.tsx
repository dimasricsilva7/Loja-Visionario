interface BadgeProps {
  label: string;
  color?: string | null;
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-black"
      style={{ backgroundColor: color || "#d6ff3f" }}
    >
      {label}
    </span>
  );
}
