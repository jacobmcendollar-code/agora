import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatScore, timeAgo } from "@/lib/utils";
import { JoinedCommunities } from "@/components/joined-communities";
import { NsfwToggle } from "@/components/nsfw-toggle";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ username: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const normalized = username.toLowerCase();
  const session = await auth();

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

  const isOwnProfile = session?.user?.username?.toLowerCase() === user.username;

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
          },
        },
      },
    }),
  ]);

  const communities = subscriptions.map((s) => ({
    name: s.community.name,
    title: s.community.title,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div>
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
        {isOwnProfile && (
          <div className="shrink-0 pt-1">
            <NsfwToggle />
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Joined communities ({communities.length})
        </h2>
        <JoinedCommunities communities={communities} />
      </section>

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