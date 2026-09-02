import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsToBRL } from "@/lib/money";
import { maskCPF } from "@/lib/br-validators";
import { StatusPill } from "@/components/admin/StatusPill";
import { DashboardDateFilter } from "@/components/admin/DashboardDateFilter";

export const metadata: Metadata = { title: "Dashboard" };

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { from, to } = await searchParams;

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (from) createdAt.gte = new Date(`${from}T00:00:00`);
  if (to) createdAt.lte = new Date(`${to}T23:59:59.999`);

  const where = {
    deletedAt: null,
    ...(from || to ? { createdAt } : {}),
  };

  const [totalOrders, totalAgg, paidOrders, paidAgg, recentOrders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { totalCents: true, shippingCents: true } }),
    prisma.order.count({ where: { ...where, status: "PAID" } }),
    prisma.order.aggregate({ where: { ...where, status: "PAID" }, _sum: { totalCents: true, shippingCents: true } }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: { include: { product: true } }, utm: true },
    }),
  ]);

  const cards = [
    { label: "Pedidos gerados", value: totalOrders.toLocaleString("pt-BR") },
    {
      label: "Valor de pedidos gerados",
      value: formatCentsToBRL((totalAgg._sum.totalCents ?? 0) + (totalAgg._sum.shippingCents ?? 0)),
    },
    { label: "Pedidos pagos", value: paidOrders.toLocaleString("pt-BR") },
    {
      label: "Vendas aprovadas",
      value: formatCentsToBRL((paidAgg._sum.totalCents ?? 0) + (paidAgg._sum.shippingCents ?? 0)),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-black tracking-tight">Dashboard</h1>
        <DashboardDateFilter />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Pedidos recentes</h2>
          <Link href="/admin/pedidos" className="text-xs font-semibold text-brand hover:underline">
            Ver todos
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">Nenhum pedido no período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="p-3 font-semibold">Cliente</th>
                  <th className="p-3 font-semibold">Produto</th>
                  <th className="p-3 font-semibold">Valor</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Origem</th>
                  <th className="p-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-none">
                    <td className="p-3">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted">{maskCPF(order.customerCpf)}</div>
                    </td>
                    <td className="p-3">{order.items[0]?.product.name}</td>
                    <td className="p-3 font-semibold">{formatCentsToBRL(order.totalCents + order.shippingCents)}</td>
                    <td className="p-3">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="p-3 text-xs text-muted">{order.utm?.source || "—"}</td>
                    <td className="p-3 text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
