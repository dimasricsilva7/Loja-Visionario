import { createHmac, timingSafeEqual } from "crypto";

export interface SessionPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function createSessionHelpers(secretEnvVar: string, ttlSeconds: number) {
  function getSecret(): string {
    const secret = process.env[secretEnvVar];
    if (!secret) {
      throw new Error(`${secretEnvVar} não configurada no ambiente do servidor`);
    }
    return secret;
  }

  function sign(payload: string): string {
    return createHmac("sha256", getSecret()).update(payload).digest("base64url");
  }

  function createToken(user: { id: string; email: string }): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionPayload = { sub: user.id, email: user.email, iat: now, exp: now + ttlSeconds };
    const payloadB64 = base64url(JSON.stringify(payload));
    return `${payloadB64}.${sign(payloadB64)}`;
  }

  function verifyToken(token: string | undefined | null): SessionPayload | null {
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

  return { createToken, verifyToken, maxAge: ttlSeconds };
}
