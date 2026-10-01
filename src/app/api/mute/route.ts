import { NextResponse } from "next/server";
import { z } from "zod";
import { clearBlockNotifications } from "@/lib/blocks";
import { ensureComplianceSchema } from "@/lib/ensure-compliance-schema";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

const postSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(["block", "unblock", "mute", "unmute"]),
});

function blockedFlag(action: string) {
  return action === "block" || action === "mute";
}

export async function GET(req: Request) {
  const muterId = await userIdFromRequest(req);
  if (!muterId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  await ensureComplianceSchema();

  const mutes = await prisma.mute.findMany({
    where: { muterId },
    orderBy: { createdAt: "desc" },
    include: {
      muted: {
        select: {
          id: true,
          username: true,
          image: true,
          deletedAt: true,
        },
      },
    },
  });

  const blocks = mutes
    .filter((row) => !row.muted.deletedAt)
    .map((row) => ({
      id: row.id,
      userId: row.muted.id,
      username: row.muted.username,
      image: row.muted.image,
      createdAt: row.createdAt.toISOString(),
    }));

  return NextResponse.json(
    { blocks, mutes: blocks },
    { headers: PRIVATE_NO_STORE_HEADERS }
  );
}

export async function POST(req: Request) {
  const muterId = await userIdFromRequest(req);
  if (!muterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureComplianceSchema();
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { userId, action } = parsed.data;

    if (userId === muterId) {
      return NextResponse.json(
        { error: "You cannot block yourself" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });
    if (!target || target.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (blockedFlag(action)) {
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
      await clearBlockNotifications(muterId, userId);
      return NextResponse.json({ blocked: true, muted: true });
    }

    await prisma.mute.deleteMany({
      where: {
        muterId,
        mutedId: userId,
      },
    });
    return NextResponse.json({ blocked: false, muted: false });
  } catch (err) {
    console.error("[mute POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
