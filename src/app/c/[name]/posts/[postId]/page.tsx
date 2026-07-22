import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { formatScore, timeAgo } from "@/lib/utils";
import { CommentForm } from "@/components/comment-form";
import { VoteButtons } from "@/components/vote-buttons";
import { Comment } from "@/components/comment";
import { RemovePostButton } from "@/components/remove-post-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string; postId: string }> };

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
          <VoteButtons targetType="post" targetId={post.id} initialScore={post.score} />

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

            {post.thumbnail && (
              <a
                href={post.url || post.thumbnail}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block"
              >
                <img
                  src={post.thumbnail}
                  alt=""
                  className="max-h-80 w-full rounded-lg object-cover hover:opacity-95 transition"
                />
              </a>
            )}

            {post.url && !post.thumbnail && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {post.url}
              </a>
            )}

            {post.body && (
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
            />
          ))}
        </div>
      </section>
    </div>
  );
}