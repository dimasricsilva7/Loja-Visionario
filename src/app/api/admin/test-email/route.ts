import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";
import { getStoreSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/resend";
import { buildAbandonedCartEmail } from "@/lib/abandoned-cart-email";
import { buildOrderConfirmedEmail } from "@/lib/order-confirmed-email";

const testEmailSchema = z.object({
  to: z.string().email(),
  template: z.enum(["abandoned", "confirmed"]).default("abandoned"),
});

/**
 * Envia um dos templates de e-mail com dados de um produto real, mas um
 * pedido fictício — pra conferir visualmente o e-mail (formatação, imagem,
 * valores) sem precisar esperar um carrinho abandonado ou pagamento de verdade.
 */
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = testEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } });
  if (!product) {
    return NextResponse.json({ error: "Nenhum produto ativo encontrado pra montar o teste" }, { status: 404 });
  }

  const settings = await getStoreSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const base = {
    customerName: "Cliente Teste",
    orderNumber: "TESTE1234",
    siteUrl,
    productName: product.name,
    productImage: product.image,
    size: "M",
    quantity: 1,
    totalCents: product.priceCents,
    shippingCents: settings.shippingCents,
  };

  const { subject, html, text } =
    parsed.data.template === "confirmed"
      ? buildOrderConfirmedEmail(base)
      : buildAbandonedCartEmail({ ...base, productSlug: product.slug });

  const result = await sendEmail({ to: parsed.data.to, subject: `[TESTE] ${subject}`, html, text });
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Falha ao enviar" }, { status: 502 });
  }

  return NextResponse.json({ sent: true, resendId: result.id });
}
