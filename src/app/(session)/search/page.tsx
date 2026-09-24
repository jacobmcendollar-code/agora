import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatScore, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q || "").trim();

  if (!query) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-zinc-500">Type something in the search box above.</p>
      </div>
    );
  }

  const [communities, posts] = await Promise.all([
    prisma.community.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { posts: true } },
      },
    }),
    prisma.post.findMany({
      where: {
        moderationStatus: "approved",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { body: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { username: true } },
        community: { select: { name: true, title: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Search results</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Results for “{query}”
        </p>
      </div>

      {/* Communities */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Communities ({communities.length})
        </h2>
        {communities.length === 0 ? (
          <p className="text-sm text-zinc-500">No communities found.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {communities.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.name}`}
                className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="font-semibold">{c.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                  {c.description}
                </p>
                <div className="mt-2 text-xs text-zinc-400">
                  {c._count.posts} posts
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Posts */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Posts ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-500">No posts found.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900"
              >
                <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                  <Link
                    href={`/c/${post.community.name}`}
                    className="font-medium hover:underline"
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
                  <time>{timeAgo(post.createdAt)}</time>
                  <span>•</span>
                  <span>{formatScore(post.score)} points</span>
                </div>
                <Link
                  href={`/c/${post.community.name}/posts/${post.id}`}
                  className="font-medium hover:underline"
                >
                  {post.title}
                </Link>
                {post.body && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {post.body}
                  </p>
                )}
                <div className="mt-1 text-xs text-zinc-500">
                  {post._count.comments} comments
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}