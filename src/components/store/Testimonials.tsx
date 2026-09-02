import { CheckCircleIcon, StarIcon } from "@/components/icons";

const reviews = [
  {
    name: "Marina S.",
    location: "São Paulo, SP",
    text: "Qualidade muito acima do que eu esperava pelo preço. Chegou rápido e o caimento é perfeito.",
  },
  {
    name: "Lucas A.",
    location: "Rio de Janeiro, RJ",
    text: "Comprei pelo PIX e já recebi a confirmação na hora. Processo super simples.",
  },
  {
    name: "Beatriz F.",
    location: "Belo Horizonte, MG",
    text: "Já é a segunda peça que compro. Atendimento rápido e entrega dentro do prazo.",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section id="sobre" className="border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1 text-brand">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} />
            ))}
            <span className="ml-2 text-sm font-bold text-fg">4.9 de 5</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">O que dizem sobre a gente</h2>
          <p className="text-sm text-muted">Avaliações de clientes que já compraram na loja</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-5 shadow-card"
            >
              <div className="flex items-center gap-0.5 text-brand">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <p className="text-sm text-fg">&ldquo;{review.text}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3 border-t border-border pt-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">
                  {initials(review.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-bold">{review.name}</p>
                    <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
                  </div>
                  <p className="truncate text-[11px] text-muted">{review.location} · Compra verificada</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
