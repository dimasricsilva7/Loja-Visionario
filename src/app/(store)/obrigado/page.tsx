import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsToBRL } from "@/lib/money";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ pedido?: string }>;
}

export default async function ObrigadoPage({ searchParams }: PageProps) {
  const { pedido } = await searchParams;
  const order = pedido
    ? await prisma.order.findUnique({
        where: { id: pedido },
        include: { items: { include: { product: true } } },
      })
    : null;

  const isPaid = order?.status === "PAID";

  return (
    <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
          isPaid ? "bg-brand text-brand-fg" : "bg-surface-2 text-muted"
        }`}
      >
        {isPaid ? "✓" : "⏳"}
      </div>

      <h1 className="mt-6 text-2xl font-black tracking-tight sm:text-3xl">
        {isPaid ? "Pagamento aprovado!" : "Estamos confirmando seu pagamento"}
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted">
        {isPaid
          ? "Seu pedido foi confirmado com sucesso. Você receberá as informações no e-mail cadastrado."
          : "Assim que recebermos a confirmação do banco, atualizaremos automaticamente o status do seu pedido."}
      </p>

      {order && (
        <div className="mt-8 w-full max-w-sm rounded-lg border border-border bg-surface p-5 text-left text-sm">
          <div className="flex justify-between border-b border-border pb-3">
            <span className="text-muted">Pedido</span>
            <span className="font-mono text-xs">{order.id.slice(0, 12).toUpperCase()}</span>
          </div>
          <div className="flex justify-between border-b border-border py-3">
            <span className="text-muted">Produto</span>
            <span>{order.items[0]?.product.name}</span>
          </div>
          <div className="flex justify-between pt-3 font-bold">
            <span>Total pago</span>
            <span>{formatCentsToBRL(order.totalCents)}</span>
          </div>
        </div>
      )}

      <Link href="/" className="mt-8 text-sm font-semibold text-brand hover:underline">
        Voltar para a loja
      </Link>
    </div>
  );
}
