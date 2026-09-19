import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { buildAbandonedCartEmail } from "@/lib/abandoned-cart-email";

const ABANDONED_AFTER_MS = 60 * 60 * 1000; // 1 hora sem pagar
// Nunca varre pedidos mais velhos que isso: evita reprocessar histórico antigo
// caso o cron fique fora do ar por um tempo e o eventKey de corte suba de uma vez.
const MAX_LOOKBACK_MS = 26 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = Date.now();
  const orders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      deletedAt: null,
      abandonedEmailSentAt: null,
      createdAt: {
        lte: new Date(now - ABANDONED_AFTER_MS),
        gte: new Date(now - MAX_LOOKBACK_MS),
      },
    },
    include: { items: { include: { product: true } } },
    take: 50,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  let sent = 0;

  for (const order of orders) {
    const item = order.items[0];
    if (!item) continue;

    const { subject, html, text } = buildAbandonedCartEmail({
      customerName: order.customerName,
      orderNumber: order.orderNumber ?? order.id.slice(0, 8).toUpperCase(),
      siteUrl,
      productSlug: item.product.slug,
      productName: item.product.name,
      productImage: item.product.image,
      size: item.size,
      quantity: item.quantity,
      totalCents: order.totalCents,
      shippingCents: order.shippingCents,
    });

    const result = await sendEmail({ to: order.customerEmail, subject, html, text });

    // Marca como enviado mesmo se o Resend falhar, pra não ficar tentando
    // reenviar pro mesmo pedido a cada execução do cron (a cada 15 min).
    await prisma.order.update({ where: { id: order.id }, data: { abandonedEmailSentAt: new Date() } });

    if (result.ok) sent++;
  }

  return NextResponse.json({ scanned: orders.length, sent });
}
