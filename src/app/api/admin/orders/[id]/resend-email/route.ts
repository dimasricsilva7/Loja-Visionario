import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";
import { sendEmail } from "@/lib/resend";
import { buildAbandonedCartEmail } from "@/lib/abandoned-cart-email";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.deletedAt) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const item = order.items[0];
  if (!item) {
    return NextResponse.json({ error: "Pedido sem itens" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Falha ao enviar" }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
