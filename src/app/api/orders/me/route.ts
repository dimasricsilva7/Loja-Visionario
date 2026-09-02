import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerApi } from "@/lib/auth-customer";

export async function GET() {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      estimatedDeliveryDays: order.estimatedDeliveryDays,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      totalCents: order.totalCents,
      item: order.items[0]
        ? { name: order.items[0].product.name, image: order.items[0].product.image, size: order.items[0].size }
        : null,
    })),
  });
}
