import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { signPromotionalEmailToken } from "@/lib/promotional-email-token";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.username)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        promotionalEmails: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const origin = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://www.agor4.com";
    const base = origin.replace(/\/$/, "");

    const links = users.map((u) => {
      const token = signPromotionalEmailToken(u.id);
      return {
        username: u.username,
        email: u.email,
        promotionalEmails: u.promotionalEmails,
        optInUrl: `${base}/email/opt-in?token=${token}`,
        optOutUrl: `${base}/email/opt-out?token=${token}`,
      };
    });

    return NextResponse.json({ count: links.length, links });
  } catch (err) {
    console.error("[admin promotional-email-links]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

