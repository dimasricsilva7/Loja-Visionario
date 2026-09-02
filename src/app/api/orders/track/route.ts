import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`track:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const codigo = request.nextUrl.searchParams.get("codigo")?.trim();
  if (!codigo) {
    return NextResponse.json({ error: "Informe o código do pedido" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: codigo }, { externalReference: codigo }],
    },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado. Confira o código e tente novamente." }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      estimatedDeliveryDays: order.estimatedDeliveryDays,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      totalCents: order.totalCents,
      customerName: order.customerName,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      item: order.items[0]
        ? { name: order.items[0].product.name, image: order.items[0].product.image, size: order.items[0].size }
        : null,
    },
  });
}
