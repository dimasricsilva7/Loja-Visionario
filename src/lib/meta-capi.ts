import crypto from "crypto";

const GRAPH_API_VERSION = "v21.0";

function hash(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Meta exige telefone com código do país (55 para o Brasil), só dígitos.
 * O telefone salvo no banco já vem sem o 55 (formato local com DDD).
 */
export function normalizePhoneForMeta(phoneDigits: string): string {
  if (phoneDigits.startsWith("55") && phoneDigits.length >= 12) return phoneDigits;
  return `55${phoneDigits}`;
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

/**
 * Reconstrói o parâmetro fbc a partir do fbclid quando o cookie _fbc do
 * navegador não está disponível (ex.: evento disparado a partir de um
 * webhook, sem contexto de requisição do comprador).
 * Formato documentado pela Meta: fb.1.<timestamp_ms>.<fbclid>
 */
export function buildFbcFromClickId(fbclid: string, timestampMs: number): string {
  return `fb.1.${timestampMs}.${fbclid}`;
}

export interface MetaUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface MetaCustomData {
  currency: string;
  value: number;
  contentIds?: string[];
  contentType?: string;
  contents?: { id: string; quantity: number; item_price?: number }[];
  numItems?: number;
  orderId?: string;
}

export interface SendMetaEventInput {
  eventName: "PageView" | "InitiateCheckout" | "Purchase";
  eventId: string;
  eventSourceUrl: string;
  userData: MetaUserData;
  customData?: MetaCustomData;
}

function buildUserData(u: MetaUserData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (u.email) data.em = [hash(u.email)];
  if (u.phone) data.ph = [hash(u.phone)];
  if (u.firstName) data.fn = [hash(u.firstName)];
  if (u.lastName) data.ln = [hash(u.lastName)];
  if (u.city) data.ct = [hash(u.city)];
  if (u.state) data.st = [hash(u.state)];
  if (u.zip) data.zp = [hash(u.zip)];
  if (u.country) data.country = [hash(u.country)];
  if (u.externalId) data.external_id = [hash(u.externalId)];
  if (u.clientIpAddress) data.client_ip_address = u.clientIpAddress;
  if (u.clientUserAgent) data.client_user_agent = u.clientUserAgent;
  if (u.fbp) data.fbp = u.fbp;
  if (u.fbc) data.fbc = u.fbc;
  return data;
}

/**
 * Envia um evento para a Conversions API da Meta (server-side), espelhando
 * o evento do Pixel do navegador. O event_id precisa ser o MESMO enviado
 * pelo fbq('track', ...) no navegador para a Meta deduplicar os dois sinais
 * em um único evento, somando o alcance de ambos sem contar a conversão 2x.
 *
 * Nunca lança: falha de rede/API aqui não pode derrubar checkout nem webhook.
 */
export async function sendMetaEvent(input: SendMetaEventInput): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn(`Meta CAPI não configurado — evento ${input.eventName} não enviado`);
    return;
  }

  const customData = input.customData
    ? {
        currency: input.customData.currency,
        value: input.customData.value,
        ...(input.customData.contentIds ? { content_ids: input.customData.contentIds } : {}),
        ...(input.customData.contentType ? { content_type: input.customData.contentType } : {}),
        ...(input.customData.contents ? { contents: input.customData.contents } : {}),
        ...(input.customData.numItems !== undefined ? { num_items: input.customData.numItems } : {}),
        ...(input.customData.orderId ? { order_id: input.customData.orderId } : {}),
      }
    : undefined;

  const body = {
    access_token: accessToken,
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data: buildUserData(input.userData),
        ...(customData ? { custom_data: customData } : {}),
      },
    ],
  };

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`Meta CAPI respondeu ${response.status} para ${input.eventName}`, detail.slice(0, 500));
    }
  } catch (error) {
    console.error(`Falha ao enviar evento ${input.eventName} para o Meta CAPI`, error);
  }
}
