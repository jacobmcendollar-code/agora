import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatScore, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const normalized = username.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: {
      id: true,
      username: true,
      createdAt: true,
      image: true,
    },
  });

  if (!user) notFound();

  const [posts, comments, subscriptions] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: user.id, moderationStatus: "approved" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        community: { select: { name: true, title: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.comment.findMany({
      where: { authorId: user.id, moderationStatus: "approved" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            community: { select: { name: true, title: true } },
          },
        },
      },
    }),
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        community: {
          select: {
            name: true,
            title: true,
            description: true,
            _count: { select: { posts: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold">{user.username}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Joined{" "}
          {user.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Joined communities */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Joined communities ({subscriptions.length})
        </h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-zinc-500">Not joined any communities yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {subscriptions.map((sub) => (
              <Link
                key={sub.id}
                href={`/c/${sub.community.name}`}
                className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="font-semibold">{sub.community.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                  {sub.community.description}
                </p>
                <div className="mt-2 text-xs text-zinc-400">
                  {sub.community._count.posts} posts
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent posts */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-500">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-lg border bg-white p-4 dark:bg-zinc-900"
              >
                <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                  <Link
                    href={`/c/${post.community.name}`}
                    className="font-medium hover:underline"
                  >
                    {post.community.title}
                  </Link>
                  <span>•</span>
                  <span>{timeAgo(post.createdAt)}</span>
                  <span>•</span>
                  <span>{formatScore(post.score)} points</span>
                </div>
                <Link
                  href={`/c/${post.community.name}/posts/${post.id}`}
                  className="font-medium hover:underline"
                >
                  {post.title}
                </Link>
                <div className="mt-1 text-xs text-zinc-500">
                  {post._count.comments} comments
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Recent comments */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent Comments</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-500">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border bg-white p-4 dark:bg-zinc-900"
              >
                <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                  <Link
                    href={`/c/${comment.post.community.name}/posts/${comment.post.id}`}
                    className="font-medium hover:underline"
                  >
                    {comment.post.title}
                  </Link>
                  <span>•</span>
                  <span>{comment.post.community.title}</span>
                  <span>•</span>
                  <span>{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}