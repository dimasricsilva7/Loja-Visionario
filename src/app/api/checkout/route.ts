import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/schemas";
import { createPixTransaction, BravoPayError } from "@/lib/bravopay";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getCustomerSession } from "@/lib/customer-session";
import { getStoreSettings } from "@/lib/settings";
import { generateOrderNumber } from "@/lib/order-number";
import { sendMetaEvent, normalizePhoneForMeta, splitName, buildFbcFromClickId } from "@/lib/meta-capi";

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

  const { productSlug, customer, utm, shipping, size, quantity, paymentPlan: requestedPlan } = parsed.data;

  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  if (product.stock <= 0) {
    return NextResponse.json({ error: "Produto esgotado" }, { status: 409 });
  }
  if (quantity > product.stock) {
    return NextResponse.json({ error: "Quantidade indisponível em estoque" }, { status: 409 });
  }

  const settings = await getStoreSettings();
  const shippingCents = settings.shippingCents;
  const lineTotalCents = product.priceCents * quantity;

  // O plano de parcelamento e a quantidade de parcelas vêm sempre do produto
  // no banco — o cliente só escolhe "à vista" ou "parcelado", nunca o valor.
  // O frete é sempre cobrado integralmente hoje, mesmo no plano parcelado.
  const canInstallment = product.installments > 1;
  const paymentPlan = requestedPlan === "PARCELADO" && canInstallment ? "PARCELADO" : "AVISTA";
  const installmentCount = paymentPlan === "PARCELADO" ? product.installments : 1;
  const productPortion =
    paymentPlan === "PARCELADO" ? Math.ceil(lineTotalCents / installmentCount) : lineTotalCents;
  const chargeAmountCents = productPortion + shippingCents;

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
      orderNumber: existing.orderNumber,
      status: existing.status,
      amountCents: chargeAmountCents,
      shippingCents: existing.shippingCents,
      pix: { copyPaste: existing.pixCopyPaste, expiresAt: existing.pixExpiresAt },
      product: { name: product.name, image: product.image },
    });
  }

  const externalReference = `pedido_${randomUUID()}`;
  const customerSession = await getCustomerSession();

  let order: Awaited<ReturnType<typeof prisma.order.create>> | undefined;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: customerSession?.sub,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          customerCpf: customer.cpf,
          totalCents: lineTotalCents,
          shippingCents,
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
              { productId: product.id, quantity, unitPriceCents: product.priceCents, size: size || null },
            ],
          },
          ...(utm && Object.values(utm).some(Boolean)
            ? { utm: { create: utm } }
            : {}),
        },
      });
    } catch (error) {
      // Colisão rara no numero de pedido gerado aleatoriamente: tenta de novo.
      if (attempt === 4) throw error;
    }
  }

  if (!order) {
    return NextResponse.json({ error: "Não foi possível criar o pedido. Tente novamente." }, { status: 500 });
  }

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

    const confirmedOrder = order;

    after(() => {
      const { firstName, lastName } = splitName(customer.name);
      const fbp = request.cookies.get("_fbp")?.value;
      const fbcCookie = request.cookies.get("_fbc")?.value;
      const fbc = fbcCookie || (utm?.fbclid ? buildFbcFromClickId(utm.fbclid, Date.now()) : undefined);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      void sendMetaEvent({
        eventName: "InitiateCheckout",
        eventId: parsed.data.metaEventId || randomUUID(),
        eventSourceUrl: `${siteUrl}/checkout/${product.slug}`,
        userData: {
          email: customer.email,
          phone: normalizePhoneForMeta(customer.phone),
          firstName,
          lastName,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.cep,
          country: "br",
          externalId: customer.cpf,
          clientIpAddress: ip,
          clientUserAgent: request.headers.get("user-agent") || undefined,
          fbp,
          fbc,
        },
        customData: {
          currency: "BRL",
          value: chargeAmountCents / 100,
          contentIds: [product.id],
          contentType: "product",
          contents: [{ id: product.id, quantity, item_price: product.priceCents / 100 }],
          numItems: quantity,
          orderId: confirmedOrder.orderNumber ?? confirmedOrder.id,
        },
      });
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: mapBravoPayStatus(transaction.status),
      amountCents: chargeAmountCents,
      shippingCents,
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
