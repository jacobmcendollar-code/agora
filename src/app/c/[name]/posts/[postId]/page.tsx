import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatScore, timeAgo } from "@/lib/utils";
import { CommentForm } from "@/components/comment-form";
import { VoteButtons } from "@/components/vote-buttons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ name: string; postId: string }> };

export default async function PostPage({ params }: Props) {
  const { name, postId } = await params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { username: true } },
      community: { select: { name: true, title: true } },
      comments: {
        where: { parentId: null, moderationStatus: "approved" },
        orderBy: [{ score: "desc" }, { createdAt: "asc" }],
        include: {
          author: { select: { username: true } },
          replies: {
            where: { moderationStatus: "approved" },
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { username: true } },
            },
          },
        },
      },
    },
  });

  if (!post || post.community.name !== name) notFound();

  return (
    <div className="space-y-6">
      <div className="text-sm text-zinc-500">
        <Link href={`/c/${post.community.name}`} className="hover:underline">
          c/{post.community.name}
        </Link>
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
                u/{post.author.username}
              </Link>
              <span>•</span>
              <time>{timeAgo(post.createdAt)}</time>
            </div>

            <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>

            {post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {post.url}
              </a>
            )}

            {post.body && (
              <div className="mt-4 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {post.body}
              </div>
            )}
          </div>
        </div>
      </article>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
        </h2>

        <CommentForm postId={post.id} communityName={post.community.name} />

        <div className="space-y-4">
          {post.comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
              <div className="flex gap-3">
                <VoteButtons
                  targetType="comment"
                  targetId={comment.id}
                  initialScore={comment.score}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-x-2 text-xs text-zinc-500">
                    <Link
                      href={`/u/${comment.author.username}`}
                      className="font-medium hover:underline"
                    >
                      u/{comment.author.username}
                    </Link>
                    <span>•</span>
                    <time>{timeAgo(comment.createdAt)}</time>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{comment.body}</div>

                  {comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
                      {comment.replies.map((reply) => (
                        <div key={reply.id}>
                          <div className="mb-1 flex items-center gap-x-2 text-xs text-zinc-500">
                            <Link
                              href={`/u/${reply.author.username}`}
                              className="font-medium hover:underline"
                            >
                              u/{reply.author.username}
                            </Link>
                            <span>•</span>
                            <time>{timeAgo(reply.createdAt)}</time>
                            <span className="text-zinc-400">· {formatScore(reply.score)}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{reply.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}