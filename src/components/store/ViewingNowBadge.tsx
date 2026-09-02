export function ViewingNowBadge({ count, className = "" }: { count: number; className?: string }) {
  return (
    <div
      className={`flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold text-black shadow-sm ${className}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
      {count.toLocaleString("pt-BR")} vendo agora
    </div>
  );
}
