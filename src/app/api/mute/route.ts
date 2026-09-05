import { NextResponse } from "next/server";
import { z } from "zod";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

const postSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["mute", "unmute"]),
});

export async function GET(req: Request) {
  const muterId = await userIdFromRequest(req);
  if (!muterId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  const mutes = await prisma.mute.findMany({
    where: { muterId },
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

  return NextResponse.json(
    {
      mutes: mutes.map((m) => ({
        id: m.id,
        userId: m.muted.id,
        username: m.muted.username,
        image: m.muted.image,
        createdAt: m.createdAt.toISOString(),
      })),
    },
    { headers: PRIVATE_NO_STORE_HEADERS }
  );
}

export async function POST(req: Request) {
  const muterId = await userIdFromRequest(req);
  if (!muterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { userId, action } = parsed.data;

    if (userId === muterId) {
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
            muterId,
            mutedId: userId,
          },
        },
        update: {},
        create: {
          muterId,
          mutedId: userId,
        },
      });
      return NextResponse.json({ muted: true });
    }

    await prisma.mute.deleteMany({
      where: {
        muterId,
        mutedId: userId,
      },
    });
    return NextResponse.json({ muted: false });
  } catch (err) {
    console.error("[mute POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
