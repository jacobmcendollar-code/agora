import { NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8),
});

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}

/** Auth.js v5 cookie name — also the JWT encode salt. */
function sessionCookieName(): string {
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "";
  const secure =
    process.env.NODE_ENV === "production" || authUrl.startsWith("https://");
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

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
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        image: true,
        showNsfw: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const cookieName = sessionCookieName();
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
        showNsfw: user.showNsfw,
      },
    });
  } catch (err) {
    console.error("[mobile/login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
