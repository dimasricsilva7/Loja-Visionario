import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { FulfillmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";
import { FULFILLMENT_STAGES } from "@/lib/fulfillment";

const fulfillmentSchema = z.object({
  fulfillmentStatus: z.enum(FULFILLMENT_STAGES.map((s) => s.key) as [string, ...string[]]),
  estimatedDeliveryDays: z.number().int().min(1).max(90).nullable().optional(),
});

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

  const parsed = fulfillmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        fulfillmentStatus: parsed.data.fulfillmentStatus as FulfillmentStatus,
        estimatedDeliveryDays: parsed.data.estimatedDeliveryDays,
      },
    });
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.order.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
}
