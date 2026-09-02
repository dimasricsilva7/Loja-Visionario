"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCentsToBRL } from "@/lib/money";
import { OrderStatusTimeline } from "./OrderStatusTimeline";

interface TrackedOrder {
  id: string;
  status: string;
  fulfillmentStatus: string;
  estimatedDeliveryDays: number | null;
  createdAt: string;
  totalCents: number;
  customerName: string;
  shippingCity: string | null;
  shippingState: string | null;
  item: { name: string; image: string; size: string | null } | null;
}

export function OrderTracker() {
  const searchParams = useSearchParams();
  const [codigo, setCodigo] = useState(searchParams.get("codigo") ?? "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function track(code: string) {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/track?codigo=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pedido não encontrado.");
        setOrder(null);
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = searchParams.get("codigo");
    if (initial) {
      // Adiado para fora do corpo síncrono do efeito.
      queueMicrotask(() => track(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    track(codigo);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Código do pedido</span>
          <input
            className="input"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Cole aqui o código do seu pedido"
          />
        </label>
        <Button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Rastrear"}
        </Button>
      </form>

      {error && <p className="text-center text-sm font-medium text-danger">{error}</p>}

      {order && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-lg border border-border bg-surface p-4">
            {order.item && (
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
                <Image src={order.item.image} alt={order.item.name} fill className="object-cover" sizes="56px" />
              </div>
            )}
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold">{order.item?.name}</p>
              {order.item?.size && <p className="text-xs text-muted">Tamanho: {order.item.size}</p>}
              <p className="text-xs text-muted">
                Pedido em {new Date(order.createdAt).toLocaleDateString("pt-BR")} · {formatCentsToBRL(order.totalCents)}
              </p>
              {order.shippingCity && (
                <p className="text-xs text-muted">
                  Entrega: {order.shippingCity}/{order.shippingState}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <OrderStatusTimeline
              status={order.status}
              fulfillmentStatus={order.fulfillmentStatus}
              estimatedDeliveryDays={order.estimatedDeliveryDays}
            />
          </div>
        </div>
      )}
    </div>
  );
}
