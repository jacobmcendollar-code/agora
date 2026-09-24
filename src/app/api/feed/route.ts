import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/ranking";
import { userIdFromRequest } from "@/lib/request-user";

const loadPublicPosts = unstable_cache(
  async (communityName: string) => {
    let communityId: string | null = null;
    if (communityName) {
      const community = await prisma.community.findUnique({
        where: { name: communityName },
        select: { id: true },
      });
      if (!community) return { missing: true as const, posts: [] };
      communityId = community.id;
    }

    const posts = await prisma.post.findMany({
      where: {
        moderationStatus: { in: ["approved", "author_deleted"] },
        ...(communityId ? { communityId } : {}),
      },
      take: 200,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { username: true } },
        community: { select: { name: true, title: true, postFormat: true } },
        _count: { select: { comments: true } },
      },
    });

    return {
      missing: false as const,
      posts: posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        author: {
          username:
            p.moderationStatus === "author_deleted"
              ? "[deleted]"
              : p.author.username,
        },
        hot: hotScore(p.score, p.createdAt),
      })),
    };
  },
  ["public-feed-posts-v1"],
  { revalidate: 30 }
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "trending";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const communityName = searchParams.get("community");
  const scope = searchParams.get("scope") || "all"; // "joined" | "all"
  const limit = 15;

  const userId = await userIdFromRequest(req);

  // Anonymous feeds are identical for every logged-out caller. Logged-in feeds
  // stay private (mutes and joined communities) and are not CDN-cached: Vercel
  // would otherwise reuse one URL's response for every caller.
  if (!userId) {
    const cached = await loadPublicPosts(communityName || "");
    if (cached.missing) {
      return NextResponse.json(
        { posts: [], nextPage: null },
        { headers: PRIVATE_NO_STORE_HEADERS }
      );
    }

    const ranked = cached.posts.map((p) => ({ ...p }));
    if (sort === "my" || sort === "trending") {
      ranked.sort((a, b) => b.hot - a.hot);
    } else if (sort === "top") {
      ranked.sort((a, b) => b.score - a.score);
    } else {
      ranked.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const start = (page - 1) * limit;
    const pagePosts = ranked.slice(start, start + limit);
    const hasMore = start + limit < ranked.length;

    return NextResponse.json(
      {
        posts: pagePosts,
        nextPage: hasMore ? page + 1 : null,
      },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  let mutedIds: string[] = [];
  const mutes = await prisma.mute.findMany({
    where: { muterId: userId },
    select: { mutedId: true },
  });
  mutedIds = mutes.map((m) => m.mutedId);

  let communityIds: string[] | null = null;

  if (communityName) {
    const community = await prisma.community.findUnique({
      where: { name: communityName },
      select: { id: true },
    });
    if (!community) {
      return NextResponse.json(
        { posts: [], nextPage: null },
        { headers: PRIVATE_NO_STORE_HEADERS }
      );
    }
    communityIds = [community.id];
  } else if (scope === "joined") {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
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
      ...(mutedIds.length ? { authorId: { notIn: mutedIds } } : {}),
    },
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true, postFormat: true } },
      _count: { select: { comments: true } },
    },
  });

  let ranked = posts.map((p) => ({
    ...p,
    author: {
      username:
        p.moderationStatus === "author_deleted"
          ? "[deleted]"
          : p.author.username,
    },
    hot: hotScore(p.score, p.createdAt),
  }));

  if (sort === "my" || sort === "trending") {
    ranked.sort((a, b) => b.hot - a.hot);
  } else if (sort === "top") {
    ranked.sort((a, b) => b.score - a.score);
  } else {
    ranked.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const start = (page - 1) * limit;
  const pagePosts = ranked.slice(start, start + limit);
  const hasMore = start + limit < ranked.length;

  return NextResponse.json(
    {
      posts: pagePosts,
      nextPage: hasMore ? page + 1 : null,
    },
    { headers: PRIVATE_NO_STORE_HEADERS }
  );
}
