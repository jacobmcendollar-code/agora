import { NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getAuthSecret, MOBILE_SESSION_COOKIE } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { clientIp, consumeRateLimit, isRateLimited, LIMITS } from "@/lib/rate-limit";

const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8),
});

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(req: Request) {
  try {
    const secret = getAuthSecret();
    if (!secret) {
      console.error("[mobile/login] AUTH_SECRET or NEXTAUTH_SECRET is missing");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const { username, password } = parsed.data;
    const normalizedUsername = username.toLowerCase();
    const ip = clientIp(req.headers);
    const ipLimit = await consumeRateLimit(
      `login:ip:${ip}`,
      LIMITS.loginPerIp.limit,
      LIMITS.loginPerIp.windowMs
    );
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }
    const userLock = await isRateLimited(
      `login:fail:${normalizedUsername}`,
      LIMITS.loginFailuresPerUsername.limit
    );
    if (userLock.limited) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(userLock.retryAfter) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        image: true,
        bio: true,
        createdAt: true,
        showNsfw: true,
      },
    });

    if (!user || !user.passwordHash) {
      await consumeRateLimit(
        `login:fail:${normalizedUsername}`,
        LIMITS.loginFailuresPerUsername.limit,
        LIMITS.loginFailuresPerUsername.windowMs
      );
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await consumeRateLimit(
        `login:fail:${normalizedUsername}`,
        LIMITS.loginFailuresPerUsername.limit,
        LIMITS.loginFailuresPerUsername.windowMs
      );
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const cookieName = MOBILE_SESSION_COOKIE;
    const sessionToken = await encode({
      token: {
        sub: user.id,
        id: user.id,
        name: user.username,
        username: user.username,
        email: user.email,
        picture: user.image,
        showNsfw: user.showNsfw,
      },
      secret,
      salt: cookieName,
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({
      sessionToken,
      cookieName,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
        createdAt: user.createdAt,
        showNsfw: user.showNsfw,
      },
    });
  } catch (err) {
    console.error("[mobile/login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
