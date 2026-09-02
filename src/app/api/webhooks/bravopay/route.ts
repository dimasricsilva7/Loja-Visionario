import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTransaction, BravoPayError } from "@/lib/bravopay";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getChargedAmountCents } from "@/lib/money";
import { sendMetaEvent, normalizePhoneForMeta, splitName, buildFbcFromClickId } from "@/lib/meta-capi";

const webhookSchema = z.object({
  event: z.string().min(1),
  data: z
    .object({
      id: z.string().optional(),
      status: z.string().optional(),
      external_reference: z.string().optional(),
      paid_at: z.string().optional(),
    })
    .partial()
    .optional(),
  transaction: z
    .object({
      id: z.string().optional(),
      status: z.string().optional(),
      external_reference: z.string().optional(),
    })
    .partial()
    .optional(),
  id: z.string().optional(),
});

function extractTransactionId(payload: z.infer<typeof webhookSchema>): string | null {
  return payload.data?.id || payload.transaction?.id || payload.id || null;
}

/**
 * A documentação pública da BravoPay não expõe, até o momento, um segredo de
 * assinatura de webhook. Por isso a confirmação de pagamento nunca confia
 * cegamente no payload recebido: sempre revalidamos o status consultando a
 * própria API da BravoPay antes de marcar um pedido como pago.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`webhook:${ip}`, 120, 60_000)) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload não reconhecido" }, { status: 400 });
  }

  const payload = parsed.data;
  const transactionId = extractTransactionId(payload);
  const eventKey = `${payload.event}:${transactionId ?? "unknown"}:${payload.data?.paid_at ?? ""}`;

  try {
    await prisma.webhookEvent.create({
      data: {
        eventKey,
        event: payload.event,
        transactionId: transactionId ?? undefined,
        externalReference: payload.data?.external_reference || payload.transaction?.external_reference || undefined,
        payload: json as object,
      },
    });
  } catch {
    // Violação de unique constraint = evento duplicado já processado antes.
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!transactionId) {
    return NextResponse.json({ received: true, warning: "sem transaction id" });
  }

  try {
    if (payload.event === "transaction.paid") {
      await confirmPayment(transactionId);
    } else if (payload.event === "transaction.refunded" || payload.event === "transaction.chargeback") {
      await prisma.order.updateMany({
        where: { bravopayTransactionId: transactionId, status: { not: "REFUNDED" } },
        data: { status: "REFUNDED" },
      });
    }

    await prisma.webhookEvent.updateMany({ where: { eventKey }, data: { processed: true } });
  } catch (error) {
    console.error("Erro ao processar webhook BravoPay", {
      event: payload.event,
      transactionId,
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
    return NextResponse.json({ received: true, processed: false });
  }

  return NextResponse.json({ received: true });
}

async function confirmPayment(bravopayTransactionId: string) {
  const order = await prisma.order.findUnique({
    where: { bravopayTransactionId },
    include: { items: true, utm: true },
  });
  if (!order || order.status !== "PENDING") return; // já processado ou pedido desconhecido

  let confirmedPaid = false;
  try {
    const transaction = await getTransaction(bravopayTransactionId);
    confirmedPaid = transaction.status.toUpperCase() === "PAID";
  } catch (error) {
    if (error instanceof BravoPayError) {
      throw error;
    }
    throw error;
  }

  if (!confirmedPaid) return;

  // Update condicional: só aplica se ainda estiver PENDING, garantindo idempotência
  // mesmo sob entregas duplicadas do webhook. O count confirma que esta chamada
  // foi quem realizou a transição — evita disparar o Purchase 2x sob concorrência.
  const result = await prisma.order.updateMany({
    where: { id: order.id, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });

  if (result.count !== 1) return;

  after(() => {
    const { firstName, lastName } = splitName(order.customerName);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    // Sem cookies do navegador aqui (é o BravoPay chamando, não o comprador):
    // reconstrói o fbc a partir do fbclid capturado na criação do pedido.
    const fbc = order.utm?.fbclid ? buildFbcFromClickId(order.utm.fbclid, order.createdAt.getTime()) : undefined;

    void sendMetaEvent({
      eventName: "Purchase",
      // Mesmo ID usado pelo PurchaseTracker na página /obrigado, para a Meta
      // deduplicar os dois sinais (navegador + servidor) em uma única conversão.
      eventId: `purchase_${order.id}`,
      eventSourceUrl: `${siteUrl}/obrigado?pedido=${order.id}`,
      userData: {
        email: order.customerEmail,
        phone: normalizePhoneForMeta(order.customerPhone),
        firstName,
        lastName,
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingCep,
        country: "br",
        externalId: order.customerCpf,
        fbc,
      },
      customData: {
        // Moeda real da cobrança (BRL): a Meta converte pro dólar da conta de
        // anúncios usando a cotação do dia — nunca envie "USD" com valor em reais.
        currency: "BRL",
        value: getChargedAmountCents(order) / 100,
        contentIds: order.items.map((item) => item.productId),
        contentType: "product",
        numItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        orderId: order.orderNumber ?? order.id,
      },
    });
  });
}
