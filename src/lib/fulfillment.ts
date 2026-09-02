export const FULFILLMENT_STAGES = [
  { key: "AGUARDANDO_PAGAMENTO", label: "Aguardando pagamento" },
  { key: "SEPARANDO", label: "Separando pedido" },
  { key: "ENVIADO", label: "Enviado" },
  { key: "SAIU_PARA_ENTREGA", label: "Saiu para entrega" },
  { key: "ENTREGUE", label: "Entregue" },
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STAGES)[number]["key"];

export function fulfillmentStageIndex(status: string): number {
  const index = FULFILLMENT_STAGES.findIndex((s) => s.key === status);
  return index === -1 ? 0 : index;
}
