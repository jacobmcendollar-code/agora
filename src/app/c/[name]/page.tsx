import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hotScore } from "@/lib/ranking";
import { formatScore, timeAgo } from "@/lib/utils";
import { JoinButton } from "@/components/join-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string }> };

export default async function CommunityPage({ params }: Props) {
  const { name } = await params;
  const session = await auth();

  const community = await prisma.community.findUnique({
    where: { name },
    include: {
      creator: { select: { username: true } },
    },
  });

  if (!community) notFound();

  let isJoined = false;
  if (session?.user?.id) {
    const sub = await prisma.subscription.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    });
    isJoined = !!sub;
  }

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
            <h1 className="text-2xl font-bold">{community.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{community.description}</p>
            <p className="mt-3 text-xs text-zinc-400">
              Created by{" "}
              <Link
                href={`/u/${community.creator.username}`}
                className="hover:underline"
              >
                {community.creator.username}
              </Link>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <JoinButton communityId={community.id} initialJoined={isJoined} />
            <Link
              href={`/submit?community=${community.name}`}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create Post
            </Link>
          </div>
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
                      {post.author.username}
                    </Link>
                    <span>•</span>
                    <time>{timeAgo(post.createdAt)}</time>
                  </div>

                  <div className="flex gap-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/c/${community.name}/posts/${post.id}`}>
                        <h2 className="text-lg font-semibold hover:underline">
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

                    {post.thumbnail && (
                      <Link
                        href={`/c/${community.name}/posts/${post.id}`}
                        className="hidden sm:block"
                      >
                        <img
                          src={post.thumbnail}
                          alt=""
                          className="h-20 w-28 rounded object-cover"
                        />
                      </Link>
                    )}
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