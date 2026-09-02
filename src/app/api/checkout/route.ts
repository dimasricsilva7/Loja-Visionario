import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/schemas";
import { createPixTransaction, BravoPayError } from "@/lib/bravopay";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCustomerSession } from "@/lib/customer-session";

const DUPLICATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`checkout:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante e tente novamente." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { productSlug, customer, utm, shipping, size, paymentPlan: requestedPlan } = parsed.data;

  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  if (product.stock <= 0) {
    return NextResponse.json({ error: "Produto esgotado" }, { status: 409 });
  }

  // O plano de parcelamento e a quantidade de parcelas vêm sempre do produto
  // no banco — o cliente só escolhe "à vista" ou "parcelado", nunca o valor.
  const canInstallment = product.installments > 1;
  const paymentPlan = requestedPlan === "PARCELADO" && canInstallment ? "PARCELADO" : "AVISTA";
  const installmentCount = paymentPlan === "PARCELADO" ? product.installments : 1;
  const chargeAmountCents =
    paymentPlan === "PARCELADO" ? Math.ceil(product.priceCents / installmentCount) : product.priceCents;

  // Evita criar uma nova cobrança PIX a cada duplo clique / retry do mesmo comprador.
  const existing = await prisma.order.findFirst({
    where: {
      customerEmail: customer.email,
      status: "PENDING",
      deletedAt: null,
      paymentPlan,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      items: { some: { productId: product.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing && existing.pixCopyPaste && existing.pixExpiresAt && existing.pixExpiresAt > new Date()) {
    return NextResponse.json({
      orderId: existing.id,
      status: existing.status,
      amountCents: chargeAmountCents,
      pix: { copyPaste: existing.pixCopyPaste, expiresAt: existing.pixExpiresAt },
      product: { name: product.name, image: product.image },
    });
  }

  const externalReference = `pedido_${randomUUID()}`;
  const customerSession = await getCustomerSession();

  const order = await prisma.order.create({
    data: {
      customerId: customerSession?.sub,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerCpf: customer.cpf,
      totalCents: product.priceCents,
      paymentPlan,
      installmentCount,
      status: "PENDING",
      externalReference,
      shippingCep: shipping.cep,
      shippingAddress: shipping.address,
      shippingNumber: shipping.number,
      shippingComplement: shipping.complement || null,
      shippingNeighborhood: shipping.neighborhood,
      shippingCity: shipping.city,
      shippingState: shipping.state,
      items: {
        create: [
          { productId: product.id, quantity: 1, unitPriceCents: product.priceCents, size: size || null },
        ],
      },
      ...(utm && Object.values(utm).some(Boolean)
        ? { utm: { create: utm } }
        : {}),
    },
  });

  try {
    const transaction = await createPixTransaction({
      amountCents: chargeAmountCents,
      customer,
      externalReference,
      productIdBravoPay: product.productIdBravoPay,
      utm,
    });

    if (!transaction.pix?.copy_paste) {
      throw new Error("Resposta da BravoPay sem dados de PIX");
    }

    const expiresAt = new Date(transaction.pix.expires_at);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          bravopayTransactionId: transaction.id,
          status: mapBravoPayStatus(transaction.status),
          pixCopyPaste: transaction.pix.copy_paste,
          pixExpiresAt: expiresAt,
        },
      }),
      prisma.transaction.create({
        data: {
          orderId: order.id,
          bravopayId: transaction.id,
          status: transaction.status,
          amountCents: transaction.amount_cents,
          rawResponse: transaction as object,
        },
      }),
    ]);

    return NextResponse.json({
      orderId: order.id,
      status: mapBravoPayStatus(transaction.status),
      amountCents: chargeAmountCents,
      paymentPlan,
      installmentCount,
      pix: { copyPaste: transaction.pix.copy_paste, expiresAt },
      product: { name: product.name, image: product.image },
    });
  } catch (error) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });

    const status = error instanceof BravoPayError ? error.status : 502;
    console.error("Falha ao criar transação BravoPay", {
      orderId: order.id,
      message: error instanceof Error ? error.message : "erro desconhecido",
    });

    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  }
}

function mapBravoPayStatus(status: string): "PENDING" | "PAID" | "EXPIRED" | "REFUNDED" | "FAILED" | "CANCELED" {
  const normalized = status.toUpperCase();
  const valid = ["PENDING", "PAID", "EXPIRED", "REFUNDED", "FAILED", "CANCELED"] as const;
  return (valid as readonly string[]).includes(normalized) ? (normalized as typeof valid[number]) : "PENDING";
}
