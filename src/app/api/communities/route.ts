import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { listCommunities } from "@/lib/communities";
import { readMobileSession } from "@/lib/mobile-session";
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
    return NextResponse.json(await listCommunities(session?.user?.id ?? null));
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
  const userId = session?.user?.id ?? (await readMobileSession(req))?.userId;
  if (!userId) {
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
        creatorId: userId,
      },
    });

    await prisma.subscription.create({
      data: {
        userId,
        communityId: community.id,
      },
    });

    return NextResponse.json({ name: community.name });
  } catch (err) {
    console.error("[communities POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}