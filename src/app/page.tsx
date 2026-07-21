import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/ranking";
import { formatScore, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch recent posts and sort by hot score in memory for MVP
  // Later: move hot score into a generated column or materialized view
  const posts = await prisma.post.findMany({
    where: { moderationStatus: "approved" },
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
      _count: { select: { comments: true } },
    },
  });

  const ranked = posts
    .map((p) => ({
      ...p,
      hot: hotScore(p.score, p.createdAt),
    }))
    .sort((a, b) => b.hot - a.hot)
    .slice(0, 25);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Home</h1>
        <Link
          href="/submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create Post
        </Link>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-zinc-500">
          <p className="text-lg">No posts yet.</p>
          <p className="mt-2 text-sm">
            <Link href="/communities/new" className="underline">
              Create a community
            </Link>{" "}
            and start the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex gap-4">
                {/* Score */}
                <div className="flex w-12 flex-col items-center text-sm font-medium text-zinc-500">
                  <span className="text-base text-zinc-900 dark:text-zinc-100">
                    {formatScore(post.score)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <Link
                      href={`/c/${post.community.name}`}
                      className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      c/{post.community.name}
                    </Link>
                    <span>•</span>
                    <span>u/{post.author.username}</span>
                    <span>•</span>
                    <time dateTime={post.createdAt.toISOString()}>
                      {timeAgo(post.createdAt)}
                    </time>
                  </div>

                  <Link href={`/c/${post.community.name}/posts/${post.id}`}>
                    <h2 className="text-lg font-semibold leading-snug hover:underline">
                      {post.title}
                    </h2>
                  </Link>

                  {post.body && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {post.body}
                    </p>
                  )}

                  <div className="mt-2 text-xs text-zinc-500">
                    {post._count.comments} comments
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
