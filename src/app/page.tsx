import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hotScore } from "@/lib/ranking";
import { PostFeed } from "@/components/post-feed";
import { WelcomeBanner } from "@/components/welcome-banner";

export const dynamic = "force-dynamic";

type SortOption = "trending" | "recent" | "top";

type Props = {
  searchParams: Promise<{ sort?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;
  const sort = (
    ["trending", "recent", "top"].includes(params.sort || "")
      ? params.sort
      : "trending"
  ) as SortOption;

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
      moderationStatus: { in: ["approved", "author_deleted"] },
      ...(communityIds ? { communityId: { in: communityIds } } : {}),
    },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
      _count: { select: { comments: true } },
    },
  });

  let ranked = posts.map((p) => ({
    ...p,
    author: {
      username:
        p.moderationStatus === "author_deleted"
          ? "[deleted]"
          : p.author.username,
    },
    hot: hotScore(p.score, p.createdAt),
    createdAt: p.createdAt.toISOString(),
  }));

  if (sort === "trending") {
    ranked.sort((a, b) => b.hot - a.hot);
  } else if (sort === "top") {
    ranked.sort((a, b) => b.score - a.score);
  }

  const initialPosts = ranked.slice(0, 15);
  const showingSubscribed = !!communityIds;

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "trending", label: "Trending" },
    { key: "recent", label: "Recent" },
    { key: "top", label: "Top" },
  ];

  return (
    <div className="space-y-6">
      <WelcomeBanner />

      <div className="flex items-center justify-between gap-4 border-b">
        <div className="flex gap-1 overflow-x-auto">
          {sortOptions.map((option) => (
            <Link
              key={option.key}
              href={option.key === "trending" ? "/" : `/?sort=${option.key}`}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition ${
                sort === option.key
                  ? "border-b-2 border-emerald-500 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <Link
          href="/submit"
          className="shrink-0 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create Post
        </Link>
      </div>

      {initialPosts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          {showingSubscribed ? (
            <>
              <p className="text-lg font-medium">Nothing here yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                The communities you’ve joined don’t have any posts.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/communities"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Browse communities
                </Link>
                <Link
                  href="/submit"
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Create a post
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">No posts yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Join some communities or start the first conversation.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/communities"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Browse communities
                </Link>
                <Link
                  href="/communities/new"
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Create a community
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <PostFeed initialPosts={initialPosts} sort={sort} />
      )}
    </div>
  );
}