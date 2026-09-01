import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/schemas";
import { requireAdminApi } from "@/lib/auth-admin";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  const products = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existingSlug = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existingSlug) {
    return NextResponse.json({ error: "Já existe um produto com esse slug" }, { status: 409 });
  }

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json({ product }, { status: 201 });
}
