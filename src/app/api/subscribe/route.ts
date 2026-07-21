import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  communityId: z.string().min(1),
  action: z.enum(["join", "leave"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { communityId, action } = parsed.data;
    const userId = session.user.id;

    if (action === "join") {
      // Check if already subscribed
      const existing = await prisma.subscription.findUnique({
        where: {
          userId_communityId: { userId, communityId },
        },
      });

      if (!existing) {
        await prisma.subscription.create({
          data: { userId, communityId },
        });
      }

      return NextResponse.json({ joined: true });
    } else {
      // Leave
      await prisma.subscription.deleteMany({
        where: { userId, communityId },
      });

      return NextResponse.json({ joined: false });
    }
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}