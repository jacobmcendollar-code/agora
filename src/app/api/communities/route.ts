import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export async function GET() {
  try {
    const session = await auth();
    const communities = await prisma.community.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        nsfw: true,
        postFormat: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });

    let joinedIds = new Set<string>();
    if (session?.user?.id) {
      const subs = await prisma.subscription.findMany({
        where: { userId: session.user.id },
        select: { communityId: true },
      });
      joinedIds = new Set(subs.map((s) => s.communityId));
    }

    return NextResponse.json(
      communities.map((c) => ({
        id: c.id,
        name: c.name,
        title: c.title,
        description: c.description,
        nsfw: c.nsfw,
        postFormat: c.postFormat,
        createdAt: c.createdAt.toISOString(),
        postCount: c._count.posts,
        joined: joinedIds.has(c.id),
      }))
    );
  } catch (err) {
    console.error("[communities GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const createSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(1).max(500),
  rules: z.string().max(500).optional().nullable(),
  nsfw: z.boolean().optional().default(false),
  postFormat: z.enum(["any", "media", "discussion"]).optional().default("any"),
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

    const { title, description, rules, nsfw, postFormat } = parsed.data;
    const name = slugify(title);

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Community name must include letters or numbers" },
        { status: 400 }
      );
    }

    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Name already in use" },
        { status: 400 }
      );
    }

    const community = await prisma.community.create({
      data: {
        name,
        title: title.trim(),
        description,
        rules: rules || null,
        nsfw: nsfw || false,
        postFormat,
        creatorId: session.user.id,
      },
    });

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