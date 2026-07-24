import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { JoinedCommunities } from "@/components/joined-communities";
import { NsfwToggle } from "@/components/nsfw-toggle";
import { ProfileEditor } from "@/components/profile-editor";
import { ProfileActivityTabs } from "@/components/profile-activity-tabs";

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
      bio: true,
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
      take: 50,
      include: {
        community: { select: { name: true, title: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.comment.findMany({
      where: { authorId: user.id, moderationStatus: "approved" },
      orderBy: { createdAt: "desc" },
      take: 50,
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
          take: 50,
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
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xl font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:h-20 sm:w-20 sm:text-2xl">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Joined{" "}
                {user.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {user.bio && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-700 dark:text-zinc-300">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
              <NsfwToggle />
              <ProfileEditor
                initialBio={user.bio}
                initialImage={user.image}
                username={user.username}
              />
              {showAdminTools && (
                <Link
                  href="/admin/users"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Admin tools
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Joined communities ({communities.length})
        </h2>
        <JoinedCommunities communities={communities} />
      </section>

      <ProfileActivityTabs
        isOwnProfile={isOwnProfile}
        savedPosts={savedPosts}
        posts={posts}
        comments={comments}
      />
    </div>
  );
}