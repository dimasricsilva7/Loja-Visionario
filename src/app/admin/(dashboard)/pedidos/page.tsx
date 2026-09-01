import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const metadata: Metadata = { title: "Pedidos" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: { include: { product: true } }, utm: true },
  });

  const serializable = orders.map((order) => ({
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerCpf: order.customerCpf,
    productName: order.items[0]?.product.name ?? "—",
    totalCents: order.totalCents,
    status: order.status,
    bravopayTransactionId: order.bravopayTransactionId,
    createdAt: order.createdAt.toISOString(),
    source: order.utm?.source ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black tracking-tight">Pedidos</h1>
      <OrdersTable orders={serializable} />
    </div>
  );
}
