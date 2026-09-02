import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderTracker } from "@/components/store/OrderTracker";

export const metadata: Metadata = { title: "Rastrear pedido" };
export const dynamic = "force-dynamic";

export default function TrackOrderPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Rastrear pedido</h1>
        <p className="mt-2 text-sm text-muted">
          Informe o código do pedido que você recebeu por e-mail para acompanhar o status da entrega.
        </p>
      </div>
      <Suspense fallback={null}>
        <OrderTracker />
      </Suspense>
    </div>
  );
}
