import { NextResponse } from "next/server";
import { getAdminSession } from "./session";

export async function requireAdminApi() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  return { session, response: null };
}
