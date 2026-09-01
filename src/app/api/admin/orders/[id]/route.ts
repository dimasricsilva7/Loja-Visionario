import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth-admin";

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
