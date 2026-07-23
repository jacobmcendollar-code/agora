import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/utils";
import { CommentForm } from "@/components/comment-form";
import { VoteButtons } from "@/components/vote-buttons";
import { Comment } from "@/components/comment";
import { RemovePostButton } from "@/components/remove-post-button";
import { XEmbed } from "@/components/x-embed";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string; postId: string }> };

function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

function isXLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("x.com") || url.includes("twitter.com");
}

function buildCommentTree(comments: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  comments.forEach((c) => {
    map.set(c.id, { ...c, replies: [] });
  });

  comments.forEach((c) => {
    const node = map.get(c.id);
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortFn = (a: any, b: any) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  };

  roots.sort(sortFn);
  map.forEach((node) => node.replies.sort(sortFn));

  return roots;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name, postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      community: { select: { name: true, title: true } },
      author: { select: { username: true } },
    },
  });

  if (!post || post.community.name !== name) {
    return { title: "Post not found · Agora" };
  }

  const title = `${post.title} · ${post.community.title}`;
  const description =
    post.body?.slice(0, 160) ||
    `A post in ${post.community.title} on Agora`;
  const url = `https://agor4.com/c/${post.community.name}/posts/${post.id}`;

  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: "Agora",
      type: "article",
      images: post.thumbnail
        ? [{ url: post.thumbnail, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: post.thumbnail ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.thumbnail ? [post.thumbnail] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { name, postId } = await params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
    },
  });

  if (!post || post.community.name !== name) notFound();
  if (post.moderationStatus === "removed") notFound();

  const allComments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      moderationStatus: "approved",
    },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { username: true } },
    },
  });

  const commentTree = buildCommentTree(allComments);
  const showAdmin = isAdmin(session?.user?.username);
  const youtubeId = getYouTubeId(post.url);
  const isX = isXLink(post.url);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <Link href={`/c/${post.community.name}`} className="hover:underline">
          {post.community.title}
        </Link>
        {showAdmin && <RemovePostButton postId={post.id} />}
      </div>

      <article className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div className="flex gap-4">
          <VoteButtons
            targetType="post"
            targetId={post.id}
            initialScore={post.score}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
              <Link
                href={`/u/${post.author.username}`}
                className="hover:underline"
              >
                {post.author.username}
              </Link>
              <span>•</span>
              <time>{timeAgo(post.createdAt)}</time>
            </div>

            <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>

            {/* YouTube embed */}
            {youtubeId ? (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title={post.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : post.thumbnail && !isX ? (
              <a
                href={post.url || post.thumbnail}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block"
              >
                <img
                  src={post.thumbnail}
                  alt=""
                  className="max-h-80 w-full rounded-lg object-cover transition hover:opacity-95"
                />
              </a>
            ) : null}

            {/* Official X embed */}
            {isX && post.url && <XEmbed url={post.url} />}

            {/* Plain link fallback for non-YouTube, non-X, no-thumbnail posts */}
            {post.url && !youtubeId && !isX && !post.thumbnail && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {post.url}
              </a>
            )}

            {/* Body text (hidden for X posts so the embed is the focus) */}
            {post.body && !isX && (
              <div className="mt-4 whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">
                {post.body}
              </div>
            )}
          </div>
        </div>
      </article>

      <section id="comments" className="space-y-4">
        <h2 className="text-lg font-semibold">
          {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
        </h2>

        <CommentForm postId={post.id} communityName={post.community.name} />

        <div className="space-y-4">
          {commentTree.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              postId={post.id}
              communityName={post.community.name}
              isAdminUser={showAdmin}
            />
          ))}
        </div>
      </section>
    </div>
  );
}