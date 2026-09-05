import { decode } from "@auth/core/jwt";

export const MOBILE_SESSION_COOKIE = "__Secure-authjs.session-token";

export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}

export function readSessionTokenFromCookieHeader(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== MOBILE_SESSION_COOKIE) continue;
    let value = part.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    try {
      value = decodeURIComponent(value);
    } catch {
      return value || null;
    }
    return value || null;
  }
  return null;
}

export async function readMobileSession(req: Request): Promise<{ userId: string } | null> {
  const secret = getAuthSecret();
  if (!secret) return null;
  const token = readSessionTokenFromCookieHeader(req.headers.get("cookie"));
  if (!token) return null;
  try {
    const payload = await decode({
      token,
      secret,
      salt: MOBILE_SESSION_COOKIE,
    });
    const userId =
      (typeof payload?.id === "string" && payload.id) ||
      (typeof payload?.sub === "string" && payload.sub) ||
      "";
    return userId ? { userId } : null;
  } catch {
    return null;
  }
}
