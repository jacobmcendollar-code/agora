import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

const schema = z.object({
  userId: z.string().min(1),
  banned: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.username)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { userId, banned } = parsed.data;

    // Don't allow banning yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot ban yourself" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow banning other admins
    if (isAdmin(user.username)) {
      return NextResponse.json({ error: "Cannot ban an admin" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { banned },
    });

    return NextResponse.json({ ok: true, banned });
  } catch (err) {
    console.error("[admin ban user]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}