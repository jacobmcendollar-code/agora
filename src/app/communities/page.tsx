import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CommunitiesList } from "@/components/communities-list";

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {communities.length} communities
          </p>
        </div>
        <Link
          href="/communities/new"
          className="shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create community
        </Link>
      </div>

      <CommunitiesList
        communities={list}
        isLoggedIn={!!session?.user}
      />
    </div>
  );
}