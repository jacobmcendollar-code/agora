import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Name must be lowercase letters, numbers, underscores"),
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  rules: z.string().max(500).nullable().optional(),
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
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, title, description, rules } = parsed.data;

    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Community name already taken" }, { status: 409 });
    }

    const community = await prisma.community.create({
      data: {
        name,
        title,
        description,
        rules: rules || null,
        creatorId: session.user.id,
      },
    });

    return NextResponse.json({ name: community.name, id: community.id });
  } catch (err) {
    console.error("[communities POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const communities = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  return NextResponse.json(communities);
}
