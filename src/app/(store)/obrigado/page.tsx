import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCentsToBRL } from "@/lib/money";
import { formatBRPhone, formatCEP } from "@/lib/br-validators";
import { CheckCircleIcon, ClockIcon } from "@/components/icons";
import { CopyOrderCode } from "@/components/store/CopyOrderCode";

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
  const item = order?.items[0];

  return (
    <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          isPaid ? "bg-brand text-brand-fg" : "bg-surface-2 text-muted"
        }`}
      >
        {isPaid ? <CheckCircleIcon /> : <ClockIcon className="h-7 w-7" />}
      </div>

      <h1 className="mt-6 text-2xl font-black tracking-tight sm:text-3xl">
        {isPaid ? "Pagamento aprovado!" : "Estamos confirmando seu pagamento"}
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted">
        {isPaid
          ? "Seu pedido foi confirmado com sucesso. Você receberá as informações no e-mail cadastrado."
          : "Assim que recebermos a confirmação do banco, atualizaremos automaticamente o status do seu pedido."}
      </p>

      {order && item && (
        <div className="mt-8 flex w-full max-w-md flex-col gap-4 text-left">
          <div className="rounded-lg border border-border bg-surface p-5 text-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Código do pedido (use para rastrear)
            </p>
            <CopyOrderCode code={order.id} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 text-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Pedido</p>
            <div className="flex gap-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
                <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="64px" />
              </div>
              <div>
                <p className="font-semibold">{item.product.name}</p>
                {item.size && <p className="text-xs text-muted">Tamanho: {item.size}</p>}
                <p className="text-xs text-muted">Pedido #{order.id.slice(0, 10).toUpperCase()}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-3 font-bold">
              <span>{order.paymentPlan === "PARCELADO" ? `1ª de ${order.installmentCount} parcelas` : "Total pago"}</span>
              <span>{formatCentsToBRL(order.totalCents / (order.paymentPlan === "PARCELADO" ? order.installmentCount : 1))}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 text-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Dados do comprador</p>
            <p>{order.customerName}</p>
            <p className="text-muted">{order.customerEmail}</p>
            <p className="text-muted">{formatBRPhone(order.customerPhone)}</p>
          </div>

          {order.shippingAddress && (
            <div className="rounded-lg border border-border bg-surface p-5 text-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Endereço de entrega</p>
              <p>
                {order.shippingAddress}, {order.shippingNumber}
                {order.shippingComplement ? ` - ${order.shippingComplement}` : ""}
              </p>
              <p className="text-muted">
                {order.shippingNeighborhood} — {order.shippingCity}/{order.shippingState}
              </p>
              <p className="text-muted">CEP {formatCEP(order.shippingCep || "")}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-2">
        {order && (
          <Link href={`/rastreio?codigo=${order.id}`} className="text-sm font-semibold text-brand hover:underline">
            Acompanhar status da entrega
          </Link>
        )}
        <Link href="/" className="text-sm font-semibold text-muted hover:underline">
          Voltar para a loja
        </Link>
      </div>
    </div>
  );
}
