import Image from "next/image";

export function LogoMarquee({
  storeName,
  logo1Url,
  logo2Url,
}: {
  storeName: string;
  logo1Url?: string | null;
  logo2Url?: string | null;
}) {
  const items = Array.from({ length: 16 });

  return (
    <div className="theme-light overflow-hidden border-b border-border bg-bg py-6">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-10">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-10">
            {logo1Url ? (
              <span className="relative block h-8 w-24 opacity-70 grayscale">
                <Image src={logo1Url} alt="" fill className="object-contain" sizes="96px" />
              </span>
            ) : (
              <span className="text-lg font-black tracking-widest text-muted">{storeName.toUpperCase()}</span>
            )}

            {logo2Url ? (
              <span className="relative block h-10 w-10 opacity-70 grayscale">
                <Image src={logo2Url} alt="" fill className="object-contain" sizes="40px" />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-[9px] font-bold leading-tight text-muted">
                100%
                <br />
                ORIGINAL
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
