import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hotScore } from "@/lib/ranking";
import { formatScore, timeAgo } from "@/lib/utils";
import { JoinButton } from "@/components/join-button";
import { VoteButtons } from "@/components/vote-buttons";

export const dynamic = "force-dynamic";

type SortOption = "trending" | "recent" | "top";

type Props = {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export default async function CommunityPage({ params, searchParams }: Props) {
  const { name } = await params;
  const { sort: sortParam } = await searchParams;
  const session = await auth();

  const sort = (["trending", "recent", "top"].includes(sortParam || "")
    ? sortParam
    : "trending") as SortOption;

  const community = await prisma.community.findUnique({
    where: { name },
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

  let ranked = posts.map((p) => ({
    ...p,
    hot: hotScore(p.score, p.createdAt),
  }));

  if (sort === "trending") {
    ranked.sort((a, b) => b.hot - a.hot);
  } else if (sort === "top") {
    ranked.sort((a, b) => b.score - a.score);
  }

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "trending", label: "Trending" },
    { key: "recent", label: "Recent" },
    { key: "top", label: "Top" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{community.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{community.description}</p>
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

      {/* Sort tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {sortOptions.map((option) => (
          <Link
            key={option.key}
            href={
              option.key === "trending"
                ? `/c/${community.name}`
                : `/c/${community.name}?sort=${option.key}`
            }
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

      <div className="space-y-3">
        {ranked.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-zinc-500">
            No posts yet in this community.
          </div>
        ) : (
          ranked.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border bg-white p-3 shadow-sm dark:bg-zinc-900 sm:p-4"
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
                      href={`/c/${community.name}/posts/${post.id}`}
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
                      href={`/u/${post.author.username}`}
                      className="hover:underline"
                    >
                      {post.author.username}
                    </Link>
                    <span className="hidden sm:inline">•</span>
                    <time className="hidden sm:inline">{timeAgo(post.createdAt)}</time>
                  </div>

                  <Link href={`/c/${community.name}/posts/${post.id}`}>
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
          ))
        )}
      </div>
    </div>
  );
}