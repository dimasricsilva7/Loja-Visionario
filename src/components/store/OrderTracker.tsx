"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCentsToBRL } from "@/lib/money";
import { formatCPF } from "@/lib/br-validators";
import { OrderStatusTimeline } from "./OrderStatusTimeline";

interface TrackedOrder {
  id: string;
  orderNumber: string | null;
  status: string;
  fulfillmentStatus: string;
  estimatedDeliveryDays: number | null;
  createdAt: string;
  totalCents: number;
  shippingCents: number;
  customerName: string;
  shippingCity: string | null;
  shippingState: string | null;
  item: { name: string; image: string; size: string | null } | null;
}

type Mode = "codigo" | "cpf";

export function OrderTracker() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("codigo");
  const [codigo, setCodigo] = useState(searchParams.get("codigo") ?? "");
  const [cpf, setCpf] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [orderList, setOrderList] = useState<TrackedOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function trackByCode(code: string) {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setOrderList(null);
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

  async function trackByCpf(rawCpf: string) {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/track?cpf=${encodeURIComponent(rawCpf)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nenhum pedido encontrado.");
        setOrderList(null);
        return;
      }
      setOrderList(data.orders);
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = searchParams.get("codigo");
    if (initial) {
      queueMicrotask(() => trackByCode(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "codigo") trackByCode(codigo);
    else trackByCpf(cpf);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode("codigo")}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
            mode === "codigo" ? "border-brand bg-brand text-brand-fg" : "border-border text-muted"
          }`}
        >
          Por código do pedido
        </button>
        <button
          type="button"
          onClick={() => setMode("cpf")}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
            mode === "cpf" ? "border-brand bg-brand text-brand-fg" : "border-border text-muted"
          }`}
        >
          Por CPF
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:items-end">
        {mode === "codigo" ? (
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium text-muted">Código do pedido</span>
            <input
              className="input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: NORTE86425"
            />
          </label>
        ) : (
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium text-muted">CPF usado na compra</span>
            <input
              className="input"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              placeholder="999.999.999-99"
              inputMode="numeric"
            />
          </label>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Rastrear"}
        </Button>
      </form>

      {error && <p className="text-center text-sm font-medium text-danger">{error}</p>}

      {orderList && (
        <div className="flex flex-col gap-2">
          {orderList.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => trackByCode(o.orderNumber || o.id)}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition hover:border-brand/60"
            >
              {o.item && (
                <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
                  <Image src={o.item.image} alt={o.item.name} fill className="object-cover" sizes="48px" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{o.item?.name}</p>
                <p className="text-xs text-muted">
                  Pedido #{o.orderNumber ?? o.id.slice(0, 8).toUpperCase()} ·{" "}
                  {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

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
              <p className="text-xs font-bold text-brand">Pedido #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-muted">
                {new Date(order.createdAt).toLocaleDateString("pt-BR")} ·{" "}
                {formatCentsToBRL(order.totalCents + order.shippingCents)}
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
