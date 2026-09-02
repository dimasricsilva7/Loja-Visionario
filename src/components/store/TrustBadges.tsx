function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 7h11v9H2V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 10h4l4 3.2V16h-8v-6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5 20 6v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8.5 12 11 14.5 15.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
