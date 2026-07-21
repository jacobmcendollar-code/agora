import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hotScore } from "@/lib/ranking";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "trending";
  const cursor = searchParams.get("cursor"); // post id
  const limit = 15;

  const session = await auth();

  let communityIds: string[] | null = null;
  if (session?.user?.id) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      select: { communityId: true },
    });
    if (subscriptions.length > 0) {
      communityIds = subscriptions.map((s) => s.communityId);
    }
  }

  const posts = await prisma.post.findMany({
    where: {
      moderationStatus: "approved",
      ...(communityIds ? { communityId: { in: communityIds } } : {}),
      ...(cursor ? { id: { not: cursor } } : {}),
    },
    take: limit + 5, // fetch a few extra so we can sort properly
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
      _count: { select: { comments: true } },
    },
  });

  let ranked = posts.map((p) => ({
    ...p,
    hot: hotScore(p.score, p.createdAt),
  }));

  if (sort === "trending") {
    ranked.sort((a, b) => b.hot - a.hot);
  } else if (sort === "top") {
    ranked.sort((a, b) => b.score - a.score);
  }

  // If we have a cursor, start after that post in the sorted list
  if (cursor) {
    const idx = ranked.findIndex((p) => p.id === cursor);
    if (idx !== -1) {
      ranked = ranked.slice(idx + 1);
    }
  }

  const page = ranked.slice(0, limit);
  const nextCursor = page.length === limit ? page[page.length - 1].id : null;

  return NextResponse.json({
    posts: page,
    nextCursor,
  });
}