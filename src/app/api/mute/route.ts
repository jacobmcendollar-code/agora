import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["mute", "unmute"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mutes = await prisma.mute.findMany({
    where: { muterId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      muted: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
  });

  return NextResponse.json({
    mutes: mutes.map((m) => ({
      id: m.id,
      userId: m.muted.id,
      username: m.muted.username,
      image: m.muted.image,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { userId, action } = parsed.data;

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot mute yourself" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "mute") {
      await prisma.mute.upsert({
        where: {
          muterId_mutedId: {
            muterId: session.user.id,
            mutedId: userId,
          },
        },
        update: {},
        create: {
          muterId: session.user.id,
          mutedId: userId,
        },
      });
      return NextResponse.json({ muted: true });
    }

    await prisma.mute.deleteMany({
      where: {
        muterId: session.user.id,
        mutedId: userId,
      },
    });
    return NextResponse.json({ muted: false });
  } catch (err) {
    console.error("[mute POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}