import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CommunitiesList } from "@/components/communities-list";

export const metadata = {
  title: "Communities",
  description: "Browse and join communities on Agora",
};

export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  const session = await auth();

  const communities = await prisma.community.findMany({
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

  let joinedIds = new Set<string>();
  if (session?.user?.id) {
    const subs = await prisma.subscription.findMany({
      where: { userId: session.user.id },
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

      <CommunitiesList communities={list} isLoggedIn={!!session?.user} />
    </div>
  );
}