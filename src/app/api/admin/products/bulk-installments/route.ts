import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";

const bulkInstallmentsSchema = z.discriminatedUnion("mode", [
  z.object({ category: z.string().min(1), mode: z.literal("enable"), installments: z.number().int().min(2).max(24) }),
  z.object({ category: z.string().min(1), mode: z.literal("disable") }),
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

  const parsed = bulkInstallmentsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  const { count } = await prisma.product.updateMany({
    where: { categories: { has: input.category } },
    data: { installments: input.mode === "enable" ? input.installments : 1 },
  });

  return NextResponse.json({ updated: count });
}
