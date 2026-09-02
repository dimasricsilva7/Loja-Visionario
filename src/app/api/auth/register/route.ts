import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerRegisterSchema } from "@/lib/schemas";
import { hashPassword } from "@/lib/password";
import { CUSTOMER_COOKIE_NAME, CUSTOMER_SESSION_MAX_AGE, createCustomerSessionToken } from "@/lib/customer-session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`register:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const parsed = customerRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, ...rest } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma conta com esse e-mail" }, { status: 409 });
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        name: rest.name,
        cpf: rest.cpf,
        phone: rest.phone,
        cep: rest.cep || null,
        address: rest.address || null,
        number: rest.number || null,
        complement: rest.complement || null,
        neighborhood: rest.neighborhood || null,
        city: rest.city || null,
        state: rest.state || null,
      },
    });

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
    console.error("Falha ao criar conta de cliente", {
      message: error instanceof Error ? error.message : "erro desconhecido",
    });
    return NextResponse.json({ error: "Não foi possível criar sua conta." }, { status: 500 });
  }
}
