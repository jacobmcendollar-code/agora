import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl } from "@/lib/db-ready";
import { CommunitiesList } from "@/components/communities-list";

type Props = {
  userId: string | null;
};

export async function CommunitiesScreen({ userId }: Props) {
  let communities: {
    id: string;
    name: string;
    title: string;
    description: string;
    createdAt: Date;
    _count: { posts: number };
  }[] = [];

  if (process.env.DATABASE_URL) {
    try {
      communities = await prisma.community.findMany({
        orderBy: { title: "asc" },
        select: {
          id: true,
          name: true,
          title: true,
          description: true,
          createdAt: true,
          _count: { select: { posts: true } },
        },
      });
    } catch (err) {
      if (process.env.NEXT_PHASE !== "phase-production-build") throw err;
      console.error("[communities] prerender query failed", err);
    }
  }

  let joinedIds = new Set<string>();
  if (userId && hasDatabaseUrl()) {
    const subs = await prisma.subscription.findMany({
      where: { userId },
      select: { communityId: true },
    });
    joinedIds = new Set(subs.map((s) => s.communityId));
  }

  const list = communities.map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    description: c.description,
    createdAt: c.createdAt.toISOString(),
    postCount: c._count.posts,
    joined: joinedIds.has(c.id),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-3 py-8 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Communities
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Topic-based rooms. Light moderation. Free speech by default.
          </p>
        </div>
        <Link
          href="/communities/new"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create community
        </Link>
      </div>

      <CommunitiesList communities={list} isLoggedIn={!!userId} />
    </div>
  );
}
