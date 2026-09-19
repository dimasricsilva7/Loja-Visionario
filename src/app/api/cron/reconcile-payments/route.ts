import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileOrderWithBravoPay } from "@/lib/reconcile-order";

// Dá tempo do webhook da BravoPay ou do polling do comprador na tela de
// checkout resolverem sozinhos antes de reconciliar — evita bater na API da
// BravoPay pra pedidos que ainda vão se resolver nos próximos segundos.
const MIN_AGE_MS = 10 * 60 * 1000;
// PIX expira bem antes disso; não faz sentido reconsultar pedidos mais
// velhos que 48h pra sempre a cada execução do cron.
const MAX_LOOKBACK_MS = 48 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = Date.now();
  const orders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      deletedAt: null,
      bravopayTransactionId: { not: null },
      createdAt: { lte: new Date(now - MIN_AGE_MS), gte: new Date(now - MAX_LOOKBACK_MS) },
    },
    select: { id: true },
    take: 100,
  });

  let reconciled = 0;
  for (const order of orders) {
    const result = await reconcileOrderWithBravoPay(order.id);
    if (result?.status === "PAID") reconciled++;
  }

  return NextResponse.json({ scanned: orders.length, reconciled });
}
