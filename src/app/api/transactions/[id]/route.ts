import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransaction } from "@/lib/bravopay";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const TERMINAL_STATUSES = new Set(["PAID", "EXPIRED", "REFUNDED", "FAILED", "CANCELED"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`poll:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: "Muitas requisições" }, { status: 429 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });

  if (!order || order.deletedAt) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (TERMINAL_STATUSES.has(order.status) || !order.bravopayTransactionId) {
    return NextResponse.json({ orderId: order.id, status: order.status, paidAt: order.paidAt });
  }

  try {
    const transaction = await getTransaction(order.bravopayTransactionId);
    const status = normalizeStatus(transaction.status);

    if (status !== order.status) {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status,
          paidAt: status === "PAID" ? new Date() : order.paidAt,
        },
      });

      await prisma.transaction.updateMany({
        where: { bravopayId: order.bravopayTransactionId },
        data: { status: transaction.status, rawResponse: transaction as object },
      });

      return NextResponse.json({ orderId: updated.id, status: updated.status, paidAt: updated.paidAt });
    }

    return NextResponse.json({ orderId: order.id, status: order.status, paidAt: order.paidAt });
  } catch (error) {
    console.error("Falha ao consultar transação BravoPay", {
      orderId: order.id,
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
    // Mantém o status atual em caso de instabilidade momentânea da BravoPay
    return NextResponse.json({ orderId: order.id, status: order.status, paidAt: order.paidAt });
  }
}

function normalizeStatus(status: string): "PENDING" | "PAID" | "EXPIRED" | "REFUNDED" | "FAILED" | "CANCELED" {
  const normalized = status.toUpperCase();
  const valid = ["PENDING", "PAID", "EXPIRED", "REFUNDED", "FAILED", "CANCELED"] as const;
  return (valid as readonly string[]).includes(normalized) ? (normalized as typeof valid[number]) : "PENDING";
}
