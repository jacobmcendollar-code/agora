import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CommunitiesPage() {
  const communities = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { posts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Communities</h1>
        <Link
          href="/communities/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create Community
        </Link>
      </div>

      {communities.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-zinc-500">
          No communities yet. Be the first.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.name}`}
              className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="font-semibold">{c.title}</div>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{c.description}</p>
              <div className="mt-3 text-xs text-zinc-400">
                {c._count.posts} posts
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}