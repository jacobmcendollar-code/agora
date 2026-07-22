import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { title: "asc" },
      select: {
        name: true,
        title: true,
        description: true,
        nsfw: true,
      },
    });

    return NextResponse.json(communities);
  } catch (err) {
    console.error("[communities GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Name must be lowercase letters, numbers, underscores"),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  rules: z.string().max(500).optional().nullable(),
  nsfw: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, title, description, rules, nsfw } = parsed.data;

    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "A community with that name already exists" },
        { status: 400 }
      );
    }

    const community = await prisma.community.create({
      data: {
        name,
        title,
        description,
        rules: rules || null,
        nsfw: nsfw || false,
        creatorId: session.user.id,
      },
    });

    // Auto-join the creator
    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
      },
    });

    return NextResponse.json({ name: community.name });
  } catch (err) {
    console.error("[communities POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}