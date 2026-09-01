"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPill } from "./StatusPill";
import { formatCentsToBRL } from "@/lib/money";
import { maskCPF, formatBRPhone } from "@/lib/br-validators";

interface OrderRow {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  productName: string;
  totalCents: number;
  status: string;
  bravopayTransactionId: string | null;
  createdAt: string;
  source: string | null;
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/orders/${pendingDelete}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
        Nenhum pedido encontrado.
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface lg:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="p-3 font-semibold">Cliente</th>
              <th className="p-3 font-semibold">Contato</th>
              <th className="p-3 font-semibold">Produto</th>
              <th className="p-3 font-semibold">Valor</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Transação</th>
              <th className="p-3 font-semibold">Origem</th>
              <th className="p-3 font-semibold">Data</th>
              <th className="p-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-none align-top">
                <td className="p-3">
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-xs text-muted">{maskCPF(order.customerCpf)}</div>
                </td>
                <td className="p-3 text-xs">
                  <div>{order.customerEmail}</div>
                  <div className="text-muted">{formatBRPhone(order.customerPhone)}</div>
                </td>
                <td className="p-3">{order.productName}</td>
                <td className="p-3 font-semibold">{formatCentsToBRL(order.totalCents)}</td>
                <td className="p-3"><StatusPill status={order.status} /></td>
                <td className="p-3 font-mono text-xs text-muted">{order.bravopayTransactionId?.slice(0, 14) ?? "—"}</td>
                <td className="p-3 text-xs text-muted">{order.source ?? "—"}</td>
                <td className="p-3 text-xs text-muted">{new Date(order.createdAt).toLocaleString("pt-BR")}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(order.id)}
                    className="text-xs font-semibold text-danger hover:underline"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-border bg-surface p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-xs text-muted">{maskCPF(order.customerCpf)}</p>
              </div>
              <StatusPill status={order.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
              <span>Produto</span><span className="text-right text-fg">{order.productName}</span>
              <span>Valor</span><span className="text-right font-semibold text-fg">{formatCentsToBRL(order.totalCents)}</span>
              <span>Data</span><span className="text-right text-fg">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
              <span>Origem</span><span className="text-right text-fg">{order.source ?? "—"}</span>
            </div>
            <button
              type="button"
              onClick={() => setPendingDelete(order.id)}
              className="mt-3 w-full rounded-md border border-danger/40 py-2 text-xs font-semibold text-danger"
            >
              Excluir pedido
            </button>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5">
            <h3 className="text-base font-bold">Excluir pedido?</h3>
            <p className="mt-2 text-sm text-muted">
              O pedido será removido das listagens. Esta ação pode ser feita apenas por um administrador.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-md bg-danger px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
