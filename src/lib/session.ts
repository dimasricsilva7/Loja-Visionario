import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 horas

interface SessionPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET não configurada no ambiente do servidor");
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(admin: { id: string; email: string }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: admin.id,
    email: admin.email,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = sign(payloadB64);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
