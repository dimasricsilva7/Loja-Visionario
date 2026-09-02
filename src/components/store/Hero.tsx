import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

export function Hero({ storeName, heroImageUrl }: { storeName: string; heroImageUrl?: string | null }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {heroImageUrl ? (
        <>
          <Image src={heroImageUrl} alt="" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
        </>
      ) : (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 20%, rgba(29,185,84,0.18) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 50% at 10% 90%, rgba(29,185,84,0.10) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
      )}

      <div className="container-page relative flex flex-col items-start gap-6 py-16 sm:py-24 lg:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
          Coleção em pré-lançamento
        </span>

        <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          {storeName} não segue tendência.
          <br />
          Cria a própria.
        </h1>

        <p className="max-w-lg text-base text-muted sm:text-lg">
          Peças exclusivas, produção limitada e entrega para todo o Brasil. Garanta a sua antes que
          esgote.
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink href="#produtos" size="lg" variant="primary">
            Comprar agora
          </ButtonLink>
          <ButtonLink href="#produtos" size="lg" variant="secondary">
            Ver coleção
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
