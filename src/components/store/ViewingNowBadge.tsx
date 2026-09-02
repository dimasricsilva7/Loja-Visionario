import { PersonIcon } from "@/components/icons";

export function ViewingNowBadge({
  count,
  className = "",
  compact = false,
}: {
  count: number;
  className?: string;
  compact?: boolean;
}) {
  const label = compact
    ? new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(count)
    : count.toLocaleString("pt-BR");

  return (
    <div
      className={`flex items-center gap-1 overflow-hidden rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap text-black shadow-sm ${className}`}
    >
      <PersonIcon className="shrink-0" />
      <span className="truncate">{label} vendo agora</span>
    </div>
  );
}
