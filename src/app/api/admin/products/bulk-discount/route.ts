import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";

const bulkDiscountSchema = z.discriminatedUnion("mode", [
  z.object({
    category: z.string().min(1),
    mode: z.literal("percent"),
    percent: z.number().min(1).max(90),
  }),
  z.object({
    category: z.string().min(1),
    mode: z.literal("fixed"),
    priceCents: z.number().int().min(1),
    compareAtPriceCents: z.number().int().min(1).nullable(),
  }),
  z.object({
    category: z.string().min(1),
    mode: z.literal("remove"),
  }),
]);

export async function POST(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bulkDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const products = await prisma.product.findMany({
    where: { categories: { has: input.category } },
    select: { id: true, priceCents: true, compareAtPriceCents: true },
  });

  if (products.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  if (input.mode === "fixed") {
    // Mesmo valor pra todo mundo da categoria: dá pra fazer em uma query só.
    await prisma.product.updateMany({
      where: { categories: { has: input.category } },
      data: { priceCents: input.priceCents, compareAtPriceCents: input.compareAtPriceCents },
    });
    return NextResponse.json({ updated: products.length });
  }

  if (input.mode === "remove") {
    const withDiscount = products.filter((p) => p.compareAtPriceCents !== null);
    await prisma.$transaction(
      withDiscount.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { priceCents: p.compareAtPriceCents!, compareAtPriceCents: null },
        })
      )
    );
    return NextResponse.json({ updated: withDiscount.length });
  }

  // Percentual: cada produto tem um preço diferente, então o novo preço (e o
  // "de" que guarda o preço original) precisa ser calculado por produto —
  // não dá pra fazer num updateMany só.
  await prisma.$transaction(
    products.map((p) => {
      const originalCents = p.compareAtPriceCents && p.compareAtPriceCents > p.priceCents ? p.compareAtPriceCents : p.priceCents;
      const newPriceCents = Math.round(originalCents * (1 - input.percent / 100));
      return prisma.product.update({
        where: { id: p.id },
        data: { priceCents: newPriceCents, compareAtPriceCents: originalCents },
      });
    })
  );

  return NextResponse.json({ updated: products.length });
}
