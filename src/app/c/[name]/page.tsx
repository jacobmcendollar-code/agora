import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/ranking";
import { formatScore, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string }> };

export default async function CommunityPage({ params }: Props) {
  const { name } = await params;

  const community = await prisma.community.findUnique({
    where: { name },
    include: {
      creator: { select: { username: true } },
    },
  });

  if (!community) notFound();

  const posts = await prisma.post.findMany({
    where: {
      communityId: community.id,
      moderationStatus: "approved",
    },
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
      _count: { select: { comments: true } },
    },
  });

  const ranked = posts
    .map((p) => ({ ...p, hot: hotScore(p.score, p.createdAt) }))
    .sort((a, b) => b.hot - a.hot);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">c/{community.name}</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{community.title}</p>
            <p className="mt-3 text-sm text-zinc-500">{community.description}</p>
            <p className="mt-2 text-xs text-zinc-400">
              Created by{" "}
              <Link
                href={`/u/${community.creator.username}`}
                className="hover:underline"
              >
                u/{community.creator.username}
              </Link>
            </p>
          </div>
          <Link
            href={`/submit?community=${community.name}`}
            className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create Post
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {ranked.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-zinc-500">
            No posts yet in this community.
          </div>
        ) : (
          ranked.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900"
            >
              <div className="flex gap-4">
                <div className="flex w-12 flex-col items-center text-sm font-medium text-zinc-500">
                  <span className="text-base text-zinc-900 dark:text-zinc-100">
                    {formatScore(post.score)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-x-2 text-xs text-zinc-500">
                    <Link
                      href={`/u/${post.author.username}`}
                      className="hover:underline"
                    >
                      u/{post.author.username}
                    </Link>
                    <span>•</span>
                    <time>{timeAgo(post.createdAt)}</time>
                  </div>
                  <Link href={`/c/${community.name}/posts/${post.id}`}>
                    <h2 className="text-lg font-semibold hover:underline">{post.title}</h2>
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
          ))
        )}
      </div>
    </div>
  );
}