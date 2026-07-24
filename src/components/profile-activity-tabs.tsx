"use client";

import { useState } from "react";
import Link from "next/link";
import { formatScore, timeAgo } from "@/lib/utils";
import { SaveButton } from "@/components/save-button";

type SavedPost = {
  id: string;
  title: string;
  score: number;
  createdAt: Date | string;
  community: { name: string; title: string };
  author: { username: string };
  _count: { comments: number };
};

type PostItem = {
  id: string;
  title: string;
  score: number;
  createdAt: Date | string;
  community: { name: string; title: string };
  _count: { comments: number };
};

type CommentItem = {
  id: string;
  body: string;
  createdAt: Date | string;
  post: {
    id: string;
    title: string;
    community: { name: string; title: string };
  };
};

type Props = {
  isOwnProfile: boolean;
  savedPosts: SavedPost[];
  posts: PostItem[];
  comments: CommentItem[];
};

type TabKey = "saved" | "posts" | "comments";

export function ProfileActivityTabs({
  isOwnProfile,
  savedPosts,
  posts,
  comments,
}: Props) {
  const initialTab: TabKey = isOwnProfile ? "saved" : "posts";
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [expanded, setExpanded] = useState(false);

  const tabs: { key: TabKey; label: string; count: number; show: boolean }[] = [
    {
      key: "saved",
      label: "Saved",
      count: savedPosts.length,
      show: isOwnProfile,
    },
    {
      key: "posts",
      label: "Recent Posts",
      count: posts.length,
      show: true,
    },
    {
      key: "comments",
      label: "Recent Comments",
      count: comments.length,
      show: true,
    },
  ].filter((t) => t.show);

  const previewCount = 10;

  const currentItems =
    tab === "saved" ? savedPosts : tab === "posts" ? posts : comments;

  const visibleCount = expanded
    ? currentItems.length
    : Math.min(previewCount, currentItems.length);

  const hasMore = currentItems.length > previewCount;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setExpanded(false);
            }}
            className={`shrink-0 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-b-2 border-emerald-500 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
            <span className="ml-1 text-xs text-zinc-400">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === "saved" && (
        <div className="space-y-3">
          {savedPosts.length === 0 ? (
            <p className="text-sm text-zinc-500">No saved posts yet.</p>
          ) : (
            savedPosts.slice(0, visibleCount).map((post) => (
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
                  <span>{timeAgo(new Date(post.createdAt))}</span>
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
            ))
          )}
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-zinc-500">No posts yet.</p>
          ) : (
            posts.slice(0, visibleCount).map((post) => (
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
                  <span>{timeAgo(new Date(post.createdAt))}</span>
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
            ))
          )}
        </div>
      )}

      {tab === "comments" && (
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-zinc-500">No comments yet.</p>
          ) : (
            comments.slice(0, visibleCount).map((comment) => (
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
                  <span>{timeAgo(new Date(comment.createdAt))}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">
                  {comment.body}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {hasMore && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
          >
            {expanded
              ? "Show less"
              : `Show all ${currentItems.length}`}
          </button>
        </div>
      )}
    </div>
  );
}