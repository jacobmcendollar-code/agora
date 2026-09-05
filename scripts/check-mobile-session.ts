/**
 * Encode→decode roundtrip for the mobile session JWT.
 * Uses a dummy AUTH_SECRET only; never prints tokens or secrets.
 */
import { encode } from "@auth/core/jwt";
import {
  decodeMobileSessionToken,
  MOBILE_SESSION_COOKIE,
  readMobileSession,
  readSessionTokenFromRequest,
} from "../src/lib/mobile-session";

const SECRET = "unit-test-auth-secret-not-for-production";
const USER_ID = "user_roundtrip_1";

process.env.AUTH_SECRET = SECRET;

async function main() {
  const token = await encode({
    token: {
      sub: USER_ID,
      id: USER_ID,
      name: "roundtrip",
      username: "roundtrip",
    },
    secret: SECRET,
    salt: MOBILE_SESSION_COOKIE,
    maxAge: 60,
  });

  if (!token) {
    console.error("encode failed");
    process.exit(1);
  }

  const cookieReq = new Request("https://example.test/api/mobile/communities", {
    headers: { cookie: `${MOBILE_SESSION_COOKIE}=${token}` },
  });
  const bearerReq = new Request("https://example.test/api/mobile/communities", {
    headers: { authorization: `Bearer ${token}` },
  });
  const agoraReq = new Request("https://example.test/api/vote/me", {
    headers: { "x-agora-session": token },
  });
  const missingReq = new Request("https://example.test/api/vote");

  const [fromCookie, fromBearer, fromAgora, fromMissing, fromRaw] = await Promise.all([
    readMobileSession(cookieReq),
    readMobileSession(bearerReq),
    readMobileSession(agoraReq),
    readMobileSession(missingReq),
    decodeMobileSessionToken(token),
  ]);

  if (fromMissing !== null) {
    console.error("expected anonymous when no session header is present");
    process.exit(1);
  }

  if (
    fromRaw?.userId !== USER_ID ||
    fromCookie?.userId !== USER_ID ||
    fromBearer?.userId !== USER_ID ||
    fromAgora?.userId !== USER_ID
  ) {
    console.error("Bearer/Cookie/X-Agora-Session decode did not match encode");
    process.exit(1);
  }

  const bothReq = new Request("https://example.test/api/notifications", {
    headers: {
      authorization: `Bearer ${token}`,
      cookie: `${MOBILE_SESSION_COOKIE}=not-a-valid-jwt`,
    },
  });
  if (readSessionTokenFromRequest(bothReq) !== token) {
    console.error("Bearer was not preferred over Cookie");
    process.exit(1);
  }

  console.log("ok: mobile session Bearer decode matches Cookie decode");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "roundtrip failed");
  process.exit(1);
});
