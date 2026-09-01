export function LogoMarquee({ storeName }: { storeName: string }) {
  const items = Array.from({ length: 16 });

  return (
    <div className="overflow-hidden border-b border-border bg-surface py-6">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-10 opacity-70">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-10">
            <span className="text-lg font-black tracking-widest text-muted">{storeName.toUpperCase()}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-[9px] font-bold leading-tight text-muted">
              100%
              <br />
              ORIGINAL
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
