"use client";

import { useState } from "react";
import Link from "next/link";
import { formatScore, timeAgo } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";
import { CommentForm } from "@/components/comment-form";

type CommentData = {
  id: string;
  body: string;
  score: number;
  createdAt: Date;
  author: { username: string };
  replies: CommentData[];
};

type Props = {
  comment: CommentData;
  postId: string;
  communityName: string;
  depth?: number;
};

export function Comment({ comment, postId, communityName, depth = 0 }: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className={depth > 0 ? "ml-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700" : ""}>
      <div className="rounded-lg border bg-white p-4 dark:bg-zinc-900">
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
                {comment.author.username}
              </Link>
              <span>•</span>
              <time>{timeAgo(comment.createdAt)}</time>
            </div>

            <div className="whitespace-pre-wrap break-words text-sm">
              {comment.body}
            </div>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              {showReplyForm ? "Cancel" : "Reply"}
            </button>

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
            />
          ))}
        </div>
      )}
    </div>
  );
}