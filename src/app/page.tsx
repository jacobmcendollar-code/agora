import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hotScore } from "@/lib/ranking";
import { formatScore, timeAgo } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";

export const dynamic = "force-dynamic";

type SortOption = "trending" | "recent" | "top";

type Props = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const sort = (["trending", "recent", "top"].includes(params.sort || "")
    ? params.sort
    : "trending") as SortOption;

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

  let ranked = posts.map((p) => ({
    ...p,
    hot: hotScore(p.score, p.createdAt),
  }));

  if (sort === "trending") {
    ranked.sort((a, b) => b.hot - a.hot);
  } else if (sort === "top") {
    ranked.sort((a, b) => b.score - a.score);
  }

  ranked = ranked.slice(0, 25);

  const showingSubscribed = !!communityIds;

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "trending", label: "Trending" },
    { key: "recent", label: "Recent" },
    { key: "top", label: "Top" },
  ];

  return (
    <div className="space-y-6">
      {/* Sort tabs + Create Post */}
      <div className="flex items-center justify-between gap-4 border-b">
        <div className="flex gap-1 overflow-x-auto">
          {sortOptions.map((option) => (
            <Link
              key={option.key}
              href={option.key === "trending" ? "/" : `/?sort=${option.key}`}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition ${
                sort === option.key
                  ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <Link
          href="/submit"
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
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
              className="rounded-lg border bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:p-4"
            >
              <div className="flex gap-3 sm:gap-4">
                <VoteButtons
                  targetType="post"
                  targetId={post.id}
                  initialScore={post.score}
                />

                {post.thumbnail && (
                  post.url ? (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <img
                        src={post.thumbnail}
                        alt=""
                        className="h-16 w-16 rounded object-cover sm:h-20 sm:w-28"
                      />
                    </a>
                  ) : (
                    <Link
                      href={`/c/${post.community.name}/posts/${post.id}`}
                      className="shrink-0"
                    >
                      <img
                        src={post.thumbnail}
                        alt=""
                        className="h-16 w-16 rounded object-cover sm:h-20 sm:w-28"
                      />
                    </Link>
                  )
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
                    <span className="hidden sm:inline">•</span>
                    <time className="hidden sm:inline" dateTime={post.createdAt.toISOString()}>
                      {timeAgo(post.createdAt)}
                    </time>
                  </div>

                  <Link href={`/c/${post.community.name}/posts/${post.id}`}>
                    <h2 className="text-base font-semibold leading-snug hover:underline sm:text-lg">
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