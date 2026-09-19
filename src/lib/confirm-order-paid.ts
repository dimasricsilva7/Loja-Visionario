import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChargedAmountCents } from "@/lib/money";
import { sendMetaEvent, normalizePhoneForMeta, splitName, buildFbcFromClickId } from "@/lib/meta-capi";
import { sendEmail } from "@/lib/resend";
import { buildOrderConfirmedEmail } from "@/lib/order-confirmed-email";

/**
 * Único ponto de transição PENDING -> PAID no sistema. Tanto o webhook da
 * BravoPay quanto o polling de status (/api/transactions/[id]) chamam esta
 * função, para garantir que o Purchase (Pixel + Conversions API) sempre seja
 * disparado independente de qual dos dois caminhos detectar o pagamento
 * primeiro. Nunca duplica o evento: o update condicional em status PENDING
 * garante que só quem realmente fez a transição dispara o Purchase.
 */
export async function markOrderPaidAndNotifyMeta(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, utm: true },
  });
  if (!order || order.status !== "PENDING") return false;

  const result = await prisma.order.updateMany({
    where: { id: order.id, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (result.count !== 1) return false;

  after(() => {
    const { firstName, lastName } = splitName(order.customerName);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    // Sem cookies do navegador aqui (confirmação vem de servidor, não do comprador):
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

    const item = order.items[0];
    if (item) {
      const { subject, html, text } = buildOrderConfirmedEmail({
        customerName: order.customerName,
        orderNumber: order.orderNumber ?? order.id.slice(0, 8).toUpperCase(),
        siteUrl,
        productName: item.product.name,
        productImage: item.product.image,
        size: item.size,
        quantity: item.quantity,
        totalCents: order.totalCents,
        shippingCents: order.shippingCents,
      });
      void sendEmail({ to: order.customerEmail, subject, html, text });
    }
  });

  return true;
}
