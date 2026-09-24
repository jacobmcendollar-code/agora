import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hotScore } from "@/lib/ranking";
import { hasDatabaseUrl } from "@/lib/db-ready";
import { PostFeed } from "@/components/post-feed";
import { WelcomeBanner } from "@/components/welcome-banner";
import { SuggestedCommunities } from "@/components/suggested-communities";

type SortOption = "my" | "trending" | "recent" | "top";

type HomeSession = {
  user?: { id?: string | null } | null;
} | null;

type Props = {
  session: HomeSession;
  sortParam?: string;
};

async function queryHomePosts(input: {
  useJoinedOnly: boolean;
  joinedCommunityIds: string[];
  mutedIds: string[];
}) {
  return prisma.post.findMany({
    where: {
      moderationStatus: { in: ["approved", "author_deleted"] },
      ...(input.useJoinedOnly
        ? { communityId: { in: input.joinedCommunityIds } }
        : {}),
      ...(input.mutedIds.length ? { authorId: { notIn: input.mutedIds } } : {}),
    },
    take: 200,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
      _count: { select: { comments: true } },
    },
  });
}

async function querySuggestedCommunities() {
  return prisma.community.findMany({
    where: { nsfw: false },
    orderBy: { subscriptions: { _count: "desc" } },
    take: 6,
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      _count: { select: { subscriptions: true } },
    },
  });
}

async function loadHomePosts(input: {
  isLoggedIn: boolean;
  useJoinedOnly: boolean;
  joinedCommunityIds: string[];
  mutedIds: string[];
}) {
  const empty = {
    posts: [] as Awaited<ReturnType<typeof queryHomePosts>>,
    suggested: [] as Awaited<ReturnType<typeof querySuggestedCommunities>>,
  };
  if (!process.env.DATABASE_URL) return empty;
  try {
    const [posts, suggested] = await Promise.all([
      queryHomePosts(input),
      input.isLoggedIn ? querySuggestedCommunities() : Promise.resolve([]),
    ]);
    return { posts, suggested };
  } catch (err) {
    // A build without a reachable database should still produce the ISR shell.
    // Runtime requests keep the error so an outage is not shown as an empty feed.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.error("[home] prerender query failed", err);
      return empty;
    }
    throw err;
  }
}

export async function HomeScreen({ session, sortParam }: Props) {
  const isLoggedIn = !!session?.user?.id;

  let joinedCommunityIds: string[] = [];
  let mutedIds: string[] = [];

  if (isLoggedIn && hasDatabaseUrl()) {
    const [subscriptions, mutes] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId: session!.user!.id! },
        select: { communityId: true },
      }),
      prisma.mute.findMany({
        where: { muterId: session!.user!.id! },
        select: { mutedId: true },
      }),
    ]);
    joinedCommunityIds = subscriptions.map((s) => s.communityId);
    mutedIds = mutes.map((m) => m.mutedId);
  }

  const hasJoinedCommunities = joinedCommunityIds.length > 0;
  const requested = sortParam || (isLoggedIn ? "my" : "trending");
  const allowed: SortOption[] = isLoggedIn
    ? ["my", "trending", "recent", "top"]
    : ["trending", "recent", "top"];
  const sort = (
    allowed.includes(requested as SortOption)
      ? requested
      : isLoggedIn
        ? "my"
        : "trending"
  ) as SortOption;

  const useJoinedOnly = sort === "my" && hasJoinedCommunities;
  const showSuggestions = isLoggedIn && !hasJoinedCommunities;

  const { posts, suggested: suggestedCommunities } = await loadHomePosts({
    isLoggedIn,
    useJoinedOnly,
    joinedCommunityIds,
    mutedIds,
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

  if (sort === "my" || sort === "trending") {
    ranked.sort((a, b) => b.hot - a.hot);
  } else if (sort === "top") {
    ranked.sort((a, b) => b.score - a.score);
  } else {
    ranked.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const initialPosts = ranked.slice(0, 15);

  const sortOptions: { key: SortOption; label: string }[] = [];
  if (isLoggedIn) {
    sortOptions.push({ key: "my", label: "My Feed" });
  }
  sortOptions.push(
    { key: "trending", label: "Trending" },
    { key: "recent", label: "Recent" },
    { key: "top", label: "Top" }
  );

  function hrefFor(key: SortOption) {
    if (key === "my") return "/";
    if (key === "trending" && !isLoggedIn) return "/";
    return `/?sort=${key}`;
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner />
      <div className="flex items-center justify-between gap-4 border-b pb-2">
        <div className="flex gap-1 overflow-x-auto">
          {sortOptions.map((option) => (
            <Link
              key={option.key}
              href={hrefFor(option.key)}
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
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          New Post
        </Link>
      </div>
      {isLoggedIn && (
        <SuggestedCommunities
          communities={suggestedCommunities}
          initialShow={showSuggestions}
        />
      )}
      {initialPosts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          {sort === "my" && hasJoinedCommunities ? (
            <>
              <p className="text-lg font-medium">Nothing in your feed yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Communities you’ve joined don’t have posts yet.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/communities"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Browse communities
                </Link>
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  New Post
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
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Browse communities
                </Link>
                <Link
                  href="/communities/new"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Create a community
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <PostFeed
          initialPosts={initialPosts}
          sort={sort}
          scope={useJoinedOnly ? "joined" : "all"}
        />
      )}
    </div>
  );
}
