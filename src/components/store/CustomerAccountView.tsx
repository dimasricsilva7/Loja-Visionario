"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCentsToBRL } from "@/lib/money";
import { FULFILLMENT_STAGES, fulfillmentStageIndex } from "@/lib/fulfillment";

interface CustomerOrder {
  id: string;
  status: string;
  fulfillmentStatus: string;
  createdAt: string;
  totalCents: number;
  item: { name: string; image: string; size: string | null } | null;
}

export function CustomerAccountView({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);

  useEffect(() => {
    fetch("/api/orders/me")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-5">
        <div>
          <p className="text-lg font-bold">{name}</p>
          <p className="text-sm text-muted">{email}</p>
        </div>
        <button type="button" onClick={handleLogout} className="text-sm font-semibold text-danger hover:underline">
          Sair
        </button>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">Meus pedidos</h2>

        {orders === null ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : orders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
            Você ainda não fez nenhum pedido.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const stageLabel =
                order.status === "PAID"
                  ? FULFILLMENT_STAGES[fulfillmentStageIndex(order.fulfillmentStatus)].label
                  : order.status === "PENDING"
                    ? "Aguardando pagamento"
                    : "Não concluído";

              return (
                <Link
                  key={order.id}
                  href={`/rastreio?codigo=${order.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition hover:border-brand/60"
                >
                  {order.item && (
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
                      <Image src={order.item.image} alt={order.item.name} fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{order.item?.name}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")} · {formatCentsToBRL(order.totalCents)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-bold text-brand">
                    {stageLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
