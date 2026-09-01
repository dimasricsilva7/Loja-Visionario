const items = [
  {
    title: "Entrega para todo o Brasil",
    description: "Enviamos para todos os estados com rastreio.",
    icon: "🚚",
  },
  {
    title: "Envio rápido",
    description: "Pedidos processados em até 24h úteis.",
    icon: "⚡",
  },
  {
    title: "Pagamento facilitado",
    description: "PIX com aprovação instantânea.",
    icon: "🔒",
  },
];

export function TrustBadges() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container-page grid grid-cols-1 gap-6 py-10 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden="true">{item.icon}</span>
            <div>
              <p className="text-sm font-bold">{item.title}</p>
              <p className="text-sm text-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
