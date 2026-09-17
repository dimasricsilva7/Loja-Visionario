import { HeroImageRotator } from "./HeroImageRotator";

export function Hero({ heroImages }: { heroImages: string[] }) {
  return (
    <section className="relative h-[320px] w-full overflow-hidden border-b border-border sm:h-[420px] lg:h-[480px]">
      {heroImages.length > 0 ? (
        <HeroImageRotator images={heroImages} />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 20%, rgba(29,185,84,0.18) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 50% at 10% 90%, rgba(29,185,84,0.10) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      )}
    </section>
  );
}
