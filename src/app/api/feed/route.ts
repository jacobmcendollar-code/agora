import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hotScore } from "@/lib/ranking";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "trending";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const communityName = searchParams.get("community");
  const limit = 15;

  const session = await auth();

  let communityIds: string[] | null = null;

  if (communityName) {
    const community = await prisma.community.findUnique({
      where: { name: communityName },
      select: { id: true },
    });
    if (!community) {
      return NextResponse.json({ posts: [], nextPage: null });
    }
    communityIds = [community.id];
  } else if (session?.user?.id) {
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
      moderationStatus: { in: ["approved", "author_deleted"] },
      ...(communityIds ? { communityId: { in: communityIds } } : {}),
    },
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
      _count: { select: { comments: true } },
    },
  });

  let ranked = posts.map((p) => ({
    ...p,
    author: {
      username:
        p.moderationStatus === "author_deleted" ? "[deleted]" : p.author.username,
    },
    hot: hotScore(p.score, p.createdAt),
  }));

  if (sort === "trending") {
    ranked.sort((a, b) => b.hot - a.hot);
  } else if (sort === "top") {
    ranked.sort((a, b) => b.score - a.score);
  }

  const start = (page - 1) * limit;
  const pagePosts = ranked.slice(start, start + limit);
  const hasMore = start + limit < ranked.length;

  return NextResponse.json({
    posts: pagePosts,
    nextPage: hasMore ? page + 1 : null,
  });
}