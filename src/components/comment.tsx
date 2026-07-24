"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { timeAgo } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";
import { CommentForm } from "@/components/comment-form";
import { RemoveCommentButton } from "@/components/remove-comment-button";
import { EditCommentButton } from "@/components/edit-comment-button";
import { DeleteCommentButton } from "@/components/delete-comment-button";
import { linkify } from "@/lib/linkify";

type CommentData = {
  id: string;
  body: string;
  score: number;
  createdAt: Date | string;
  authorId: string;
  moderationStatus?: string;
  author: { username: string };
  replies: CommentData[];
};

type Props = {
  comment: CommentData;
  postId: string;
  communityName: string;
  depth?: number;
  isAdminUser?: boolean;
};

function countReplies(comment: CommentData): number {
  let total = comment.replies.length;
  for (const reply of comment.replies) {
    total += countReplies(reply);
  }
  return total;
}

export function Comment({
  comment,
  postId,
  communityName,
  depth = 0,
  isAdminUser = false,
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  const adminUsernames = (process.env.NEXT_PUBLIC_ADMIN_USERNAMES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const showRemove =
    isAdminUser ||
    (session?.user?.username &&
      adminUsernames.includes(session.user.username.toLowerCase()));

  const isAuthor = session?.user?.id === comment.authorId;
  const isSoftDeleted = comment.moderationStatus === "author_deleted";
  const createdAtDate =
    typeof comment.createdAt === "string"
      ? new Date(comment.createdAt)
      : comment.createdAt;

  const replyCount = countReplies(comment);

  if (collapsed) {
    return (
      <div
        className={
          depth > 0
            ? "ml-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700"
            : ""
        }
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center justify-between rounded-lg border bg-zinc-50 px-3 py-2 text-left text-xs text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span>
            {isSoftDeleted ? "[deleted]" : comment.author.username}
            {replyCount > 0
              ? ` · ${replyCount} repl${replyCount === 1 ? "y" : "ies"} hidden`
              : " · comment hidden"}
          </span>
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            Expand
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={
        depth > 0
          ? "ml-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700"
          : ""
      }
    >
      <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
        <div className="flex gap-3">
          <VoteButtons
            targetType="comment"
            targetId={comment.id}
            initialScore={comment.score}
            size="sm"
          />

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
                {isSoftDeleted ? (
                  <span className="font-medium text-zinc-400">[deleted]</span>
                ) : (
                  <Link
                    href={`/u/${comment.author.username}`}
                    className="font-medium hover:underline"
                  >
                    {comment.author.username}
                  </Link>
                )}
                <span>•</span>
                <time>{timeAgo(createdAtDate)}</time>

                {isAuthor && !isSoftDeleted && (
                  <>
                    <span>•</span>
                    <EditCommentButton
                      commentId={comment.id}
                      initialBody={comment.body}
                      createdAt={createdAtDate.toISOString()}
                    />
                    <span>•</span>
                    <DeleteCommentButton
                      commentId={comment.id}
                      createdAt={createdAtDate.toISOString()}
                    />
                  </>
                )}

                {showRemove && !isSoftDeleted && (
                  <>
                    <span>•</span>
                    <RemoveCommentButton commentId={comment.id} />
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="ml-auto shrink-0 text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Collapse comment"
                title="Collapse comment and replies"
              >
                Collapse
              </button>
            </div>

            <div className="whitespace-pre-wrap break-words text-sm">
              {linkify(comment.body)}
            </div>

            {!isSoftDeleted && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              >
                {showReplyForm ? "Cancel" : "Reply"}
              </button>
            )}

            {showReplyForm && (
              <div className="mt-3">
                <CommentForm
                  postId={postId}
                  communityName={communityName}
                  parentId={comment.id}
                  onSuccess={() => setShowReplyForm(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              postId={postId}
              communityName={communityName}
              depth={depth + 1}
              isAdminUser={isAdminUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}