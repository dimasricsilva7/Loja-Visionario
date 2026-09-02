import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomerApi } from "@/lib/auth-customer";

export async function GET() {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const favorites = await prisma.favorite.findMany({
    where: { customerId: customer.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products: favorites.map((f) => f.product) });
}

const bodySchema = z.object({ productId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await prisma.favorite.upsert({
    where: { customerId_productId: { customerId: customer.id, productId: parsed.data.productId } },
    create: { customerId: customer.id, productId: parsed.data.productId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { customer, response } = await requireCustomerApi();
  if (response) return response;

  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId é obrigatório" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({ where: { customerId: customer.id, productId } });
  return NextResponse.json({ ok: true });
}
