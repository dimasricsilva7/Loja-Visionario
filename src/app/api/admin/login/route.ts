import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/schemas";
import { verifyPassword } from "@/lib/password";
import { ADMIN_COOKIE_NAME, SESSION_MAX_AGE, createSessionToken } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`admin-login:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!admin || !(await verifyPassword(parsed.data.password, admin.passwordHash))) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = createSessionToken({ id: admin.id, email: admin.email });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    // Loga o motivo real no servidor (visível nos Runtime Logs da Vercel)
    // sem expor detalhes de configuração para quem chama a rota.
    console.error("Falha no login do admin", {
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
    return NextResponse.json(
      { error: "Erro interno no servidor. Verifique a configuração e tente novamente." },
      { status: 500 }
    );
  }
}
