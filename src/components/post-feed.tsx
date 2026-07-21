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
  sort: string;
  communityName?: string; // if provided, only load posts from this community
  hideCommunity?: boolean; // on community pages we don't need to show the community name
};

export function PostFeed({
  initialPosts,
  sort,
  communityName,
  hideCommunity = false,
}: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 15);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setPage(2);
    setHasMore(initialPosts.length >= 15);
  }, [initialPosts, sort, communityName]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px" }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading, page]);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        sort,
        page: String(page),
      });
      if (communityName) params.set("community", communityName);

      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json();

      if (data.posts?.length) {
        setPosts((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          const fresh = data.posts.filter((p: Post) => !existing.has(p.id));
          return [...prev, ...fresh];
        });
        setPage((p) => p + 1);
        setHasMore(!!data.nextPage);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  if (posts.length === 0) return null;

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
                {!hideCommunity && (
                  <>
                    <Link
                      href={`/c/${post.community.name}`}
                      className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      {post.community.title}
                    </Link>
                    <span>•</span>
                  </>
                )}
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

              <div className="mt-2">
                <Link
                  href={`/c/${post.community.name}/posts/${post.id}#comments`}
                  className="text-xs text-zinc-500 hover:underline"
                >
                  {post._count.comments} comments
                </Link>
              </div>
            </div>
          </div>
        </article>
      ))}

      <div ref={sentinelRef} className="py-4 text-center text-sm text-zinc-500">
        {loading && "Loading more…"}
        {!hasMore && posts.length > 0 && "You’ve reached the end"}
      </div>
    </div>
  );
}