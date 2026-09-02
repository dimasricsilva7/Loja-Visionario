import { CardIcon, ShieldIcon, TruckIcon } from "@/components/icons";

const items = [
  {
    title: "Entrega para todo o Brasil",
    description: "Enviamos para todos os estados com rastreio.",
    Icon: TruckIcon,
  },
  {
    title: "PIX parcelado",
    description: "Parcele sem juros direto no PIX.",
    Icon: CardIcon,
  },
  {
    title: "Compra segura",
    description: "Pagamento protegido de ponta a ponta.",
    Icon: ShieldIcon,
  },
];

export function TrustBadges() {
  return (
    <section className="border-b border-border bg-surface-2">
      <div className="container-page grid grid-cols-1 gap-6 py-6 sm:grid-cols-3">
        {items.map(({ title, description, Icon }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand/40 text-brand">
              <Icon />
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="text-xs text-muted">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
