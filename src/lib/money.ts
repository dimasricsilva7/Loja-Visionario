export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function discountPercent(priceCents: number, compareAtPriceCents?: number | null): number | null {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return null;
  return Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100);
}

/**
 * Valor efetivamente cobrado numa transação PIX: no plano parcelado, só a
 * primeira parcela + frete é cobrada agora. Usado tanto para exibir "total
 * pago" ao comprador quanto para o valor enviado ao Pixel/Conversions API,
 * para que o ROAS reflita a receita realmente recebida.
 */
export function getChargedAmountCents(order: {
  totalCents: number;
  shippingCents: number;
  paymentPlan: string;
  installmentCount: number;
}): number {
  const productPortion =
    order.paymentPlan === "PARCELADO" ? Math.ceil(order.totalCents / order.installmentCount) : order.totalCents;
  return productPortion + order.shippingCents;
}
