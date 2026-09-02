import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerLoginSchema } from "@/lib/schemas";
import { verifyPassword } from "@/lib/password";
import { CUSTOMER_COOKIE_NAME, CUSTOMER_SESSION_MAX_AGE, createCustomerSessionToken } from "@/lib/customer-session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`customer-login:${ip}`, 8, 15 * 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
    if (!customer || !(await verifyPassword(parsed.data.password, customer.passwordHash))) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = createCustomerSessionToken({ id: customer.id, email: customer.email });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    console.error("Falha no login do cliente", {
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
