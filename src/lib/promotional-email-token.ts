import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed promotional-email token.
 *
 * Payload (UTF-8, then base64url):  `{userId}:{exp}`
 *   - userId: Prisma User.id (cuid)
 *   - exp:   unix epoch seconds (default +90 days)
 *
 * Token: `{base64url(payload)}.{base64url(hmac-sha256(payload))}`
 * HMAC key: AUTH_SECRET, falling back to NEXTAUTH_SECRET.
 *
 * Same token works for /email/opt-in and /email/opt-out.
 */

const DEFAULT_TTL_SECONDS = 90 * 24 * 60 * 60;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required to sign email tokens");
  }
  return secret;
}

function hmacSha256(data: string): Buffer {
  return createHmac("sha256", getSecret()).update(data, "utf8").digest();
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

export function signPromotionalEmailToken(
  userId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): string {
  if (!userId || typeof userId !== "string") {
    throw new Error("userId is required");
  }
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${userId}:${exp}`;
  const sig = hmacSha256(payload);
  return `${b64url(payload)}.${b64url(sig)}`;
}

export function verifyPromotionalEmailToken(
  token: string
): { userId: string; exp: number } | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return null;

    const payloadBuf = Buffer.from(payloadB64, "base64url");
    const payload = payloadBuf.toString("utf8");
    const actual = Buffer.from(sigB64, "base64url");
    const expected = hmacSha256(payload);

    if (actual.length !== expected.length) return null;
    if (!timingSafeEqual(actual, expected)) return null;

    const colon = payload.lastIndexOf(":");
    if (colon <= 0) return null;

    const userId = payload.slice(0, colon);
    const exp = Number(payload.slice(colon + 1));
    if (!userId || !Number.isFinite(exp)) return null;
    if (exp < Math.floor(Date.now() / 1000)) return null;

    return { userId, exp };
  } catch {
    return null;
  }
}

