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
import { EditPostButton } from "@/components/edit-post-button";
import { DeletePostButton } from "@/components/delete-post-button";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { ImageLightbox } from "@/components/image-lightbox";
import { XEmbed } from "@/components/x-embed";
import { TikTokEmbed } from "@/components/tiktok-embed";
import { RedditEmbed } from "@/components/reddit-embed";

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

function isTikTokLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("tiktok.com");
}

function isRedditLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("reddit.com");
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

  const isSoftDeleted = post.moderationStatus === "author_deleted";

  const allComments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      moderationStatus: { in: ["approved", "author_deleted"] },
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
  const isTikTok = isTikTokLink(post.url);
  const isReddit = isRedditLink(post.url);
  const hasRichEmbed = !!(youtubeId || isX || isTikTok || isReddit);
  const isAuthor = session?.user?.id === post.authorId;
  const sharePath = `/c/${post.community.name}/posts/${post.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <Link href={`/c/${post.community.name}`} className="hover:underline">
          {post.community.title}
        </Link>
        {showAdmin && !isSoftDeleted && <RemovePostButton postId={post.id} />}
      </div>

      <article className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <div className="flex gap-4">
          <VoteButtons
            targetType="post"
            targetId={post.id}
            initialScore={post.score}
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>

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
            ) : null}

            {isX && post.url && <XEmbed url={post.url} />}
            {isTikTok && post.url && <TikTokEmbed url={post.url} />}
            {isReddit && post.url && <RedditEmbed url={post.url} />}

            {post.thumbnail && !hasRichEmbed && (
              <ImageLightbox src={post.thumbnail} alt={post.title} />
            )}

            {post.url &&
              !youtubeId &&
              !isX &&
              !isTikTok &&
              !isReddit &&
              !post.thumbnail && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {post.url}
                </a>
              )}

            {post.body && !hasRichEmbed && (
              <div className="mt-4 whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">
                {post.body}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
              <Link
                href={`/c/${post.community.name}`}
                className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
              >
                {post.community.title}
              </Link>

              <SaveButton postId={post.id} />

              <ShareButton url={sharePath} title={post.title} />

              {isSoftDeleted ? (
                <span className="font-medium text-zinc-400">[deleted]</span>
              ) : (
                <Link
                  href={`/u/${post.author.username}`}
                  className="hover:underline"
                >
                  {post.author.username}
                </Link>
              )}

              <time>{timeAgo(post.createdAt)}</time>

              {isAuthor && !isSoftDeleted && (
                <>
                  <EditPostButton
                    postId={post.id}
                    initialTitle={post.title}
                    initialBody={post.body}
                    createdAt={post.createdAt.toISOString()}
                  />
                  <DeletePostButton
                    postId={post.id}
                    communityName={post.community.name}
                    createdAt={post.createdAt.toISOString()}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </article>

      <section id="comments" className="space-y-4">
        <h2 className="text-lg font-semibold">
          {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
        </h2>

        {!isSoftDeleted && (
          <CommentForm postId={post.id} communityName={post.community.name} />
        )}

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