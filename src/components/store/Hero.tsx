import { ButtonLink } from "@/components/ui/Button";

export function Hero({ storeName }: { storeName: string }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 20%, rgba(214,255,63,0.16) 0%, rgba(10,10,11,0) 60%), radial-gradient(50% 50% at 10% 90%, rgba(214,255,63,0.08) 0%, rgba(10,10,11,0) 60%)",
        }}
      />
      <div className="container-page flex flex-col items-start gap-6 py-16 sm:py-24 lg:py-28">
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
            Ver coleção
          </ButtonLink>
          <ButtonLink href="#produtos" size="lg" variant="secondary">
            Comprar agora
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
