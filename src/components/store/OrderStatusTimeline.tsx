import { FULFILLMENT_STAGES, fulfillmentStageIndex } from "@/lib/fulfillment";
import { CheckCircleIcon } from "@/components/icons";

export function OrderStatusTimeline({
  status,
  fulfillmentStatus,
  estimatedDeliveryDays,
}: {
  status: string;
  fulfillmentStatus: string;
  estimatedDeliveryDays?: number | null;
}) {
  if (status !== "PAID") {
    return (
      <div className="rounded-md border border-border bg-surface-2 p-4 text-sm text-muted">
        {status === "PENDING"
          ? "Aguardando confirmação do pagamento via PIX."
          : "Este pedido não foi concluído (pagamento não confirmado)."}
      </div>
    );
  }

  const currentIndex = fulfillmentStageIndex(fulfillmentStatus);

  return (
    <ol className="flex flex-col gap-0">
      {FULFILLMENT_STAGES.map((stage, i) => {
        const done = i <= currentIndex;
        const isLast = i === FULFILLMENT_STAGES.length - 1;
        return (
          <li key={stage.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-brand text-brand-fg" : "border border-border text-muted"
                }`}
              >
                {done ? <CheckCircleIcon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              {!isLast && <span className={`w-px flex-1 ${done ? "bg-brand" : "bg-border"}`} style={{ minHeight: 24 }} />}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-semibold ${done ? "text-fg" : "text-muted"}`}>{stage.label}</p>
              {stage.key === "ENVIADO" && done && estimatedDeliveryDays && (
                <p className="text-xs text-muted">Prazo estimado: {estimatedDeliveryDays} dias úteis</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
