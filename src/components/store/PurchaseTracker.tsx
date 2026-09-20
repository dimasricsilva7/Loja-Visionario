"use client";

import { useEffect, useRef } from "react";
import { trackPixelEvent, setPixelAdvancedMatching } from "@/lib/meta-pixel-client";

interface PurchaseTrackerProps {
  eventId: string;
  value: number;
  currency: string;
  orderId: string;
  contentIds: string[];
  numItems: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  externalId: string;
}

/**
 * Dispara o evento Purchase do Pixel no navegador quando o comprador está
 * vendo a confirmação. Usa o mesmo eventId do Purchase já enviado pela
 * Conversions API no webhook de pagamento, então a Meta deduplica os dois
 * em uma única conversão (o sinal do servidor garante a contagem mesmo se
 * o comprador nunca voltar a esta página).
 *
 * Também manda os dados de correspondência avançada (e-mail, telefone, ...)
 * antes do evento: o Pixel do navegador só tem fbp/fbc/IP por padrão, então
 * sem isso o sinal do navegador chega bem mais pobre que o do servidor.
 */
export function PurchaseTracker({
  eventId,
  value,
  currency,
  orderId,
  contentIds,
  numItems,
  email,
  phone,
  firstName,
  lastName,
  city,
  state,
  zip,
  externalId,
}: PurchaseTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    setPixelAdvancedMatching({ email, phone, firstName, lastName, city, state, zip, externalId });

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
  }, [eventId, value, currency, orderId, contentIds, numItems, email, phone, firstName, lastName, city, state, zip, externalId]);

  return null;
}
