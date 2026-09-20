"use client";

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

export interface PixelAdvancedMatchingData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  externalId?: string | null;
}

/**
 * Envia dados de correspondência avançada (nome, e-mail, telefone, ...) pro
 * Pixel ANTES de disparar um evento — só afeta eventos rastreados depois desta
 * chamada na mesma página. Passe os valores em texto puro: o próprio script
 * do Pixel normaliza e faz o hash antes de enviar pra Meta.
 */
export function setPixelAdvancedMatching(data: PixelAdvancedMatchingData): void {
  const fbq = getFbq();
  if (!fbq) return;

  const payload: Record<string, string> = {};
  if (data.email) payload.em = data.email;
  if (data.phone) payload.ph = data.phone;
  if (data.firstName) payload.fn = data.firstName;
  if (data.lastName) payload.ln = data.lastName;
  if (data.city) payload.ct = data.city;
  if (data.state) payload.st = data.state;
  if (data.zip) payload.zp = data.zip;
  if (data.externalId) payload.external_id = data.externalId;

  if (Object.keys(payload).length === 0) return;
  fbq("set", "userData", payload);
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
