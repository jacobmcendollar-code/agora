"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatScore, timeAgo } from "@/lib/utils";
import { SaveButton } from "@/components/save-button";
import { useToast } from "@/components/toast-provider";

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

type MutedUser = {
  id: string;
  username: string;
  image: string | null;
  createdAt: string;
};

type Props = {
  isOwnProfile: boolean;
  savedPosts: SavedPost[];
  posts: PostItem[];
  comments: CommentItem[];
  mutedUsers?: MutedUser[];
};

type TabKey = "saved" | "posts" | "comments" | "muted";

type Tab = {
  key: TabKey;
  label: string;
  count: number;
};

export function ProfileActivityTabs({
  isOwnProfile,
  savedPosts,
  posts,
  comments,
  mutedUsers = [],
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const initialTab: TabKey = isOwnProfile ? "saved" : "posts";
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [expanded, setExpanded] = useState(false);
  const [mutingId, setMutingId] = useState<string | null>(null);

  const tabs: Tab[] = [];
  if (isOwnProfile) {
    tabs.push({
      key: "saved",
      label: "Saved",
      count: savedPosts.length,
    });
  }
  tabs.push({
    key: "posts",
    label: "Recent Posts",
    count: posts.length,
  });
  tabs.push({
    key: "comments",
    label: "Recent Comments",
    count: comments.length,
  });
  if (isOwnProfile) {
    tabs.push({
      key: "muted",
      label: "Muted",
      count: mutedUsers.length,
    });
  }

  const previewCount = 10;
  const currentItems =
    tab === "saved"
      ? savedPosts
      : tab === "posts"
        ? posts
        : tab === "comments"
          ? comments
          : mutedUsers;

  const visibleCount = expanded
    ? currentItems.length
    : Math.min(previewCount, currentItems.length);
  const hasMore = currentItems.length > previewCount;

  async function unmuteUser(userId: string, username: string) {
    setMutingId(userId);
    try {
      const res = await fetch("/api/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "unmute" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to unmute", "error");
        return;
      }
      toast(`Unmuted ${username}`);
      router.refresh();
    } catch {
      toast("Failed to unmute", "error");
    } finally {
      setMutingId(null);
    }
  }

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

      {tab === "muted" && (
        <div className="space-y-3">
          {mutedUsers.length === 0 ? (
            <p className="text-sm text-zinc-500">
              You haven’t muted anyone yet.
            </p>
          ) : (
            mutedUsers.slice(0, visibleCount).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4 dark:bg-zinc-900"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.username}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/u/${user.username}`}
                      className="font-medium hover:underline"
                    >
                      {user.username}
                    </Link>
                    <div className="text-xs text-zinc-500">
                      Muted {timeAgo(new Date(user.createdAt))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={mutingId === user.id}
                  onClick={() => unmuteUser(user.id, user.username)}
                  className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  {mutingId === user.id ? "…" : "Unmute"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {hasMore && tab !== "muted" && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
          >
            {expanded ? "Show less" : `Show all ${currentItems.length}`}
          </button>
        </div>
      )}
    </div>
  );
}