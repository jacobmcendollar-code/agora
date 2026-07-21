import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hotScore } from "@/lib/ranking";
import { formatScore, timeAgo } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
    },
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

  const showingSubscribed = !!communityIds;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          {showingSubscribed && (
            <p className="mt-1 text-sm text-zinc-500">
              Showing posts from communities you’ve joined
            </p>
          )}
        </div>
        <Link
          href="/submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create Post
        </Link>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-zinc-500">
          {showingSubscribed ? (
            <>
              <p className="text-lg">No posts in your joined communities yet.</p>
              <p className="mt-2 text-sm">
                <Link href="/communities" className="underline">
                  Browse communities
                </Link>{" "}
                and join some, or create a post.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg">No posts yet.</p>
              <p className="mt-2 text-sm">
                <Link href="/communities/new" className="underline">
                  Create a community
                </Link>{" "}
                and start the conversation.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex gap-4">
                <VoteButtons
                  targetType="post"
                  targetId={post.id}
                  initialScore={post.score}
                />

                {/* Thumbnail → external link */}
                {post.thumbnail && post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:block shrink-0"
                  >
                    <img
                      src={post.thumbnail}
                      alt=""
                      className="h-20 w-28 rounded object-cover"
                    />
                  </a>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <Link
                      href={`/c/${post.community.name}`}
                      className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      {post.community.title}
                    </Link>
                    <span>•</span>
                    <Link
                      href={`/u/${post.author.username}`}
                      className="hover:underline"
                    >
                      {post.author.username}
                    </Link>
                    <span>•</span>
                    <time dateTime={post.createdAt.toISOString()}>
                      {timeAgo(post.createdAt)}
                    </time>
                  </div>

                  {/* Title → post page */}
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