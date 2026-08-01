import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 1) {
    return NextResponse.json({ communities: [], posts: [] });
  }

  const [communities, posts] = await Promise.all([
    prisma.community.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      orderBy: { title: "asc" },
      select: {
        name: true,
        title: true,
        nsfw: true,
      },
    }),
    prisma.post.findMany({
      where: {
        moderationStatus: "approved",
        title: { contains: q, mode: "insensitive" },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        community: { select: { name: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({ communities, posts });
}