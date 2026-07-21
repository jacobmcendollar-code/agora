"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatScore, timeAgo } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";

type Post = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  thumbnail: string | null;
  score: number;
  createdAt: string;
  author: { username: string };
  community: { name: string; title: string };
  _count: { comments: number };
};

type Props = {
  initialPosts: Post[];
  initialCursor: string | null;
  sort: string;
};

export function PostFeed({ initialPosts, initialCursor, sort }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset when sort changes
    setPosts(initialPosts);
    setCursor(initialCursor);
    setHasMore(!!initialCursor);
  }, [initialPosts, initialCursor, sort]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading, cursor]);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/feed?sort=${sort}&cursor=${cursor}`);
      const data = await res.json();

      if (data.posts?.length) {
        setPosts((prev) => [...prev, ...data.posts]);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-lg border bg-white p-3 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:p-4"
        >
          <div className="flex gap-3 sm:gap-4">
            <VoteButtons
              targetType="post"
              targetId={post.id}
              initialScore={post.score}
            />

            {post.thumbnail && (
              post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <img
                    src={post.thumbnail}
                    alt=""
                    className="h-16 w-16 rounded object-cover sm:h-20 sm:w-28"
                  />
                </a>
              ) : (
                <Link
                  href={`/c/${post.community.name}/posts/${post.id}`}
                  className="shrink-0"
                >
                  <img
                    src={post.thumbnail}
                    alt=""
                    className="h-16 w-16 rounded object-cover sm:h-20 sm:w-28"
                  />
                </Link>
              )
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                <Link
                  href={`/c/${post.community.name}`}
                  className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
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
                <span className="hidden sm:inline">•</span>
                <time className="hidden sm:inline" dateTime={post.createdAt}>
                  {timeAgo(new Date(post.createdAt))}
                </time>
              </div>

              <Link href={`/c/${post.community.name}/posts/${post.id}`}>
                <h2 className="text-base font-semibold leading-snug hover:underline sm:text-lg">
                  {post.title}
                </h2>
              </Link>

              {post.body && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {post.body}
                </p>
              )}

              <div className="mt-2 text-xs text-zinc-500">
                {post._count.comments} comments
              </div>
            </div>
          </div>
        </article>
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="py-4 text-center text-sm text-zinc-500">
        {loading && "Loading more…"}
        {!hasMore && posts.length > 0 && "You’ve reached the end"}
      </div>
    </div>
  );
}