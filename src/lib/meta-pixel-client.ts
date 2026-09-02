"use client";

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

/**
 * Dispara um evento padrão do Pixel no navegador com um eventID explícito,
 * usado para deduplicar com o mesmo evento enviado pela Conversions API.
 */
export function trackPixelEvent(
  eventName: "InitiateCheckout" | "Purchase",
  params: Record<string, unknown>,
  eventId: string
): void {
  const fbq = getFbq();
  if (!fbq) return;
  fbq("track", eventName, params, { eventID: eventId });
}

/**
 * Garante um único event ID por sessão de checkout de um produto, reaproveitado
 * tanto pelo Pixel do navegador quanto pelo evento equivalente enviado pelo
 * servidor (Conversions API), para a Meta deduplicar como um único evento.
 */
export function getOrCreateSessionEventId(key: string): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
