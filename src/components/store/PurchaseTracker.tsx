"use client";

import { useEffect, useRef } from "react";
import { trackPixelEvent } from "@/lib/meta-pixel-client";

interface PurchaseTrackerProps {
  eventId: string;
  value: number;
  currency: string;
  orderId: string;
  contentIds: string[];
  numItems: number;
}

/**
 * Dispara o evento Purchase do Pixel no navegador quando o comprador está
 * vendo a confirmação. Usa o mesmo eventId do Purchase já enviado pela
 * Conversions API no webhook de pagamento, então a Meta deduplica os dois
 * em uma única conversão (o sinal do servidor garante a contagem mesmo se
 * o comprador nunca voltar a esta página).
 */
export function PurchaseTracker({ eventId, value, currency, orderId, contentIds, numItems }: PurchaseTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPixelEvent(
      "Purchase",
      {
        value,
        currency,
        content_ids: contentIds,
        content_type: "product",
        num_items: numItems,
        order_id: orderId,
      },
      eventId
    );
  }, [eventId, value, currency, orderId, contentIds, numItems]);

  return null;
}
