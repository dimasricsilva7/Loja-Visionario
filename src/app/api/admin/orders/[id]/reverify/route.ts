import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-admin";
import { reconcileOrderWithBravoPay } from "@/lib/reconcile-order";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const result = await reconcileOrderWithBravoPay(id);

  if (!result) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json(result);
}
