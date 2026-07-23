"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";
import { useNsfw } from "@/components/nsfw-provider";
import { ImageLightbox } from "@/components/image-lightbox";
import { YouTubeLightbox } from "@/components/youtube-lightbox";
import { XLightbox } from "@/components/x-lightbox";
import { TikTokLightbox } from "@/components/tiktok-lightbox";

type Post = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  thumbnail: string | null;
  score: number;
  nsfw?: boolean;
  createdAt: string;
  author: { username: string };
  community: { name: string; title: string };
  _count: { comments: number };
};

type Props = {
  initialPosts: Post[];
  sort: string;
  communityName?: string;
  hideCommunity?: boolean;
};

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

export function PostFeed({
  initialPosts,
  sort,
  communityName,
  hideCommunity = false,
}: Props) {
  const { showNsfw, ready } = useNsfw();
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

  const visiblePosts = ready
    ? posts.filter((p) => showNsfw || !p.nsfw)
    : posts.filter((p) => !p.nsfw);

  if (visiblePosts.length === 0) return null;

  return (
    <div className="space-y-4">
      {visiblePosts.map((post) => {
        const youtubeId = getYouTubeId(post.url);
        const isX = isXLink(post.url);
        const isTikTok = isTikTokLink(post.url);

        return (
          <article
            key={post.id}
            className="rounded-lg border bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700 sm:p-5"
          >
            <div className="flex gap-3 sm:gap-4">
              <VoteButtons
                targetType="post"
                targetId={post.id}
                initialScore={post.score}
              />

              {post.thumbnail && youtubeId ? (
                <YouTubeLightbox
                  videoId={youtubeId}
                  thumbnail={post.thumbnail}
                  title={post.title}
                  className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-32"
                />
              ) : post.thumbnail && isX && post.url ? (
                <XLightbox
                  url={post.url}
                  thumbnail={post.thumbnail}
                  title={post.title}
                  className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-32"
                />
              ) : post.thumbnail && isTikTok && post.url ? (
                <TikTokLightbox
                  url={post.url}
                  thumbnail={post.thumbnail}
                  title={post.title}
                  className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-32"
                />
              ) : post.thumbnail && post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <img
                    src={post.thumbnail}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-32"
                  />
                </a>
              ) : post.thumbnail ? (
                <div className="shrink-0">
                  <ImageLightbox
                    src={post.thumbnail}
                    alt={post.title}
                    className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-32"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <Link href={`/c/${post.community.name}/posts/${post.id}`}>
                  <h2 className="text-lg font-semibold leading-snug hover:underline sm:text-xl">
                    {post.title}
                  </h2>
                </Link>

                {post.body && (
                  <p className="mt-2 line-clamp-2 text-base text-zinc-600 dark:text-zinc-400">
                    {post.body}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-zinc-500">
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
                  <span>•</span>
                  <time dateTime={post.createdAt}>
                    {timeAgo(new Date(post.createdAt))}
                  </time>
                  {post.nsfw && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-rose-500">NSFW</span>
                    </>
                  )}
                  <span>•</span>
                  <Link
                    href={`/c/${post.community.name}/posts/${post.id}#comments`}
                    className="hover:underline"
                  >
                    {post._count.comments} comments
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      <div ref={sentinelRef} className="py-4 text-center text-sm text-zinc-500">
        {loading && "Loading more…"}
        {!hasMore && visiblePosts.length > 0 && "You’ve reached the end"}
      </div>
    </div>
  );
}