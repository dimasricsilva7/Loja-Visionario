import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { onlyDigits } from "@/lib/br-validators";

function serializeOrder(order: {
  id: string;
  orderNumber: string | null;
  status: string;
  fulfillmentStatus: string;
  estimatedDeliveryDays: number | null;
  createdAt: Date;
  paidAt: Date | null;
  totalCents: number;
  shippingCents: number;
  customerName: string;
  shippingCity: string | null;
  shippingState: string | null;
  items: { size: string | null; product: { name: string; image: string } }[];
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    estimatedDeliveryDays: order.estimatedDeliveryDays,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    totalCents: order.totalCents,
    shippingCents: order.shippingCents,
    customerName: order.customerName,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    item: order.items[0]
      ? { name: order.items[0].product.name, image: order.items[0].product.image, size: order.items[0].size }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`track:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const codigo = request.nextUrl.searchParams.get("codigo")?.trim();
  const cpf = request.nextUrl.searchParams.get("cpf")?.trim();

  if (!codigo && !cpf) {
    return NextResponse.json({ error: "Informe o código do pedido ou o CPF" }, { status: 400 });
  }

  const include = { items: { include: { product: true } } } as const;

  if (codigo) {
    const order = await prisma.order.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: codigo }, { orderNumber: codigo.toUpperCase() }, { externalReference: codigo }],
      },
      include,
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado. Confira o código e tente novamente." }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrder(order) });
  }

  const cpfDigits = onlyDigits(cpf!);
  if (cpfDigits.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { deletedAt: null, customerCpf: cpfDigits },
    orderBy: { createdAt: "desc" },
    take: 10,
    include,
  });

  if (orders.length === 0) {
    return NextResponse.json({ error: "Nenhum pedido encontrado para esse CPF." }, { status: 404 });
  }

  return NextResponse.json({ orders: orders.map(serializeOrder) });
}
