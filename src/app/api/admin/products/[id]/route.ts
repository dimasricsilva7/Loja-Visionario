import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/schemas";
import { requireAdminApi } from "@/lib/auth-admin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.slug) {
    const existingSlug = await prisma.product.findFirst({
      where: { slug: parsed.data.slug, NOT: { id } },
    });
    if (existingSlug) {
      return NextResponse.json({ error: "Já existe um produto com esse slug" }, { status: 409 });
    }
  }

  const { relatedProductIds, ...productData } = parsed.data;

  try {
    const product = await prisma.product.update({ where: { id }, data: productData });

    if (relatedProductIds !== undefined) {
      await prisma.productRelation.deleteMany({ where: { productId: id } });
      if (relatedProductIds.length > 0) {
        await prisma.productRelation.createMany({
          data: relatedProductIds.map((relatedProductId, i) => ({
            productId: id,
            relatedProductId,
            sortOrder: i,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;

  const referenced = await prisma.orderItem.findFirst({ where: { productId: id } });
  if (referenced) {
    // Produto com histórico de pedidos: preserva integridade, apenas desativa.
    const product = await prisma.product.update({ where: { id }, data: { active: false, stock: 0 } });
    return NextResponse.json({ product, softDeactivated: true });
  }

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
}
