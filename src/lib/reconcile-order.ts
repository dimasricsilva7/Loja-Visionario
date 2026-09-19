import { prisma } from "@/lib/prisma";
import { getTransaction } from "@/lib/bravopay";
import { markOrderPaidAndNotifyMeta } from "@/lib/confirm-order-paid";

const TERMINAL_STATUSES = new Set(["PAID", "EXPIRED", "REFUNDED", "FAILED", "CANCELED"]);

function normalizeStatus(status: string): "PENDING" | "PAID" | "EXPIRED" | "REFUNDED" | "FAILED" | "CANCELED" {
  const normalized = status.toUpperCase();
  const valid = ["PENDING", "PAID", "EXPIRED", "REFUNDED", "FAILED", "CANCELED"] as const;
  return (valid as readonly string[]).includes(normalized) ? (normalized as typeof valid[number]) : "PENDING";
}

export interface ReconcileResult {
  orderId: string;
  status: string;
  paidAt: Date | null;
}

/**
 * Consulta o status real na BravoPay e atualiza o pedido se estiver
 * desatualizado. Usado em três lugares: o polling do comprador na tela de
 * checkout (/api/transactions/[id]), o botão "Reverificar pagamento" do
 * admin, e o cron de reconciliação — todos precisam do mesmo comportamento,
 * em especial passar por markOrderPaidAndNotifyMeta quando vira PAID, senão
 * o Meta nunca fica sabendo da venda.
 */
export async function reconcileOrderWithBravoPay(orderId: string): Promise<ReconcileResult | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.deletedAt) return null;

  if (TERMINAL_STATUSES.has(order.status) || !order.bravopayTransactionId) {
    return { orderId: order.id, status: order.status, paidAt: order.paidAt };
  }

  try {
    const transaction = await getTransaction(order.bravopayTransactionId);
    const status = normalizeStatus(transaction.status);

    if (status !== order.status) {
      if (status === "PAID") {
        await markOrderPaidAndNotifyMeta(order.id);
      } else {
        await prisma.order.update({ where: { id: order.id }, data: { status } });
      }

      await prisma.transaction.updateMany({
        where: { bravopayId: order.bravopayTransactionId },
        data: { status: transaction.status, rawResponse: transaction as object },
      });

      const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
      return { orderId: updated.id, status: updated.status, paidAt: updated.paidAt };
    }

    return { orderId: order.id, status: order.status, paidAt: order.paidAt };
  } catch (error) {
    console.error("Falha ao consultar transação BravoPay", {
      orderId: order.id,
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
    return { orderId: order.id, status: order.status, paidAt: order.paidAt };
  }
}
