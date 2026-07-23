import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { formatScore, timeAgo } from "@/lib/utils";
import { JoinedCommunities } from "@/components/joined-communities";
import { NsfwToggle } from "@/components/nsfw-toggle";
import { SaveButton } from "@/components/save-button";
import { CollapsibleSection } from "@/components/collapsible-section";

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

  const isOwnProfile =
    session?.user?.username?.toLowerCase() === user.username;
  const showAdminTools = isOwnProfile && isAdmin(session?.user?.username);

  const [posts, comments, subscriptions, saved] = await Promise.all([
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
    isOwnProfile
      ? prisma.savedPost.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            post: {
              include: {
                community: { select: { name: true, title: true } },
                author: { select: { username: true } },
                _count: { select: { comments: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const communities = subscriptions.map((s) => ({
    name: s.community.name,
    title: s.community.title,
  }));

  const savedPosts = saved
    .map((s) => s.post)
    .filter((p) => p && p.moderationStatus === "approved");

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
          <div className="flex shrink-0 flex-col items-end gap-3 pt-1">
            <NsfwToggle />
            {showAdminTools && (
              <Link
                href="/admin/users"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Admin tools
              </Link>
            )}
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Joined communities ({communities.length})
        </h2>
        <JoinedCommunities communities={communities} />
      </section>

      {isOwnProfile && (
        <CollapsibleSection title="Saved" count={savedPosts.length}>
          {savedPosts.length === 0 ? (
            <p className="text-sm text-zinc-500">No saved posts yet.</p>
          ) : (
            <div className="space-y-3">
              {savedPosts.map((post) => (
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
                    <Link
                      href={`/u/${post.author.username}`}
                      className="hover:underline"
                    >
                      {post.author.username}
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
                  <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{post._count.comments} comments</span>
                    <SaveButton postId={post.id} initialSaved />
                  </div>
                </article>
              ))}
            </div>
          )}
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Recent Posts" count={posts.length}>
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
      </CollapsibleSection>

      <CollapsibleSection title="Recent Comments" count={comments.length}>
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
                <p className="whitespace-pre-wrap break-words text-sm">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}