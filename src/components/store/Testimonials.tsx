const reviews = [
  {
    name: "Marina S.",
    text: "Qualidade muito acima do que eu esperava pelo preço. Chegou rápido e o caimento é perfeito.",
  },
  {
    name: "Lucas A.",
    text: "Comprei pelo PIX e já recebi a confirmação na hora. Processo super simples.",
  },
  {
    name: "Beatriz F.",
    text: "Já é a segunda peça que compro. Atendimento rápido e entrega dentro do prazo.",
  },
];

export function Testimonials() {
  return (
    <section id="sobre" className="border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="mb-8 flex flex-col items-start gap-2">
          <div className="flex items-center gap-1 text-brand">
            {"★★★★★".split("").map((star, i) => (
              <span key={i}>{star}</span>
            ))}
            <span className="ml-2 text-sm font-bold text-fg">4.9/5</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">O que dizem sobre a gente</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {reviews.map((review) => (
            <div key={review.name} className="rounded-lg border border-border bg-bg p-5">
              <p className="text-sm text-fg">&ldquo;{review.text}&rdquo;</p>
              <p className="mt-3 text-xs font-bold text-muted">{review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
