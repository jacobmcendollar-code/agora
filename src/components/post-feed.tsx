"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VoteButtons } from "@/components/vote-buttons";
import { useNsfw } from "@/components/nsfw-provider";
import { ImageLightbox } from "@/components/image-lightbox";
import { YouTubeLightbox } from "@/components/youtube-lightbox";
import { XLightbox } from "@/components/x-lightbox";
import { TikTokLightbox } from "@/components/tiktok-lightbox";
import { InstagramLightbox } from "@/components/instagram-lightbox";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import {
  CommunityLetterFallback,
  FEED_THUMB_FALLBACK_CLASSNAME,
  FEED_THUMB_IMG_CLASSNAME,
  ThumbImage,
} from "@/components/thumb-image";

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
  scope?: "joined" | "all";
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

function isInstagramLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("instagram.com") || url.includes("instagr.am");
}

function isGenericBody(body: string | null | undefined): boolean {
  if (!body) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes("enjoy the videos and music you love") ||
    lower.includes("upload original content, and share it all")
  );
}


function IconComments({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

export function PostFeed({
  initialPosts,
  sort,
  communityName,
  hideCommunity = false,
  scope = "all",
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
  }, [initialPosts, sort, communityName, scope]);

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
        scope,
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
    <div className="space-y-3.5">
      {visiblePosts.map((post) => {
        const youtubeId = getYouTubeId(post.url);
        const isX = isXLink(post.url);
        const isTikTok = isTikTokLink(post.url);
        const isInstagram = isInstagramLink(post.url);
        const sharePath = `/c/${post.community.name}/posts/${post.id}`;

        return (
          <article
            key={post.id}
            className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_4px_12px_rgba(28,25,23,0.04)] transition hover:shadow-[0_2px_4px_rgba(28,25,23,0.06),0_8px_20px_rgba(28,25,23,0.06)] dark:border-zinc-800 dark:bg-[#161618] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_4px_16px_rgba(0,0,0,0.25)] dark:hover:border-zinc-700 dark:hover:bg-[#1c1c1f] sm:p-5"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 self-start">
                <VoteButtons
                  targetType="post"
                  targetId={post.id}
                  initialScore={post.score}
                />
              </div>
              <div className="shrink-0 self-start">

              {post.thumbnail && youtubeId ? (
                <YouTubeLightbox
                  videoId={youtubeId}
                  thumbnail={post.thumbnail}
                  title={post.title}
                  communityTitle={post.community.title}
                  className={FEED_THUMB_IMG_CLASSNAME}
                />
              ) : post.thumbnail && isX && post.url ? (
                <XLightbox
                  url={post.url}
                  thumbnail={post.thumbnail}
                  title={post.title}
                  communityTitle={post.community.title}
                  className={FEED_THUMB_IMG_CLASSNAME}
                />
              ) : post.thumbnail && isTikTok && post.url ? (
                <TikTokLightbox
                  url={post.url}
                  thumbnail={post.thumbnail}
                  title={post.title}
                  communityTitle={post.community.title}
                  className={FEED_THUMB_IMG_CLASSNAME}
                />
              ) : post.thumbnail && isInstagram && post.url ? (
                <InstagramLightbox
                  url={post.url}
                  thumbnail={post.thumbnail}
                  title={post.title}
                  communityTitle={post.community.title}
                  className={FEED_THUMB_IMG_CLASSNAME}
                />
              ) : post.thumbnail && post.url ? (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <ThumbImage
                    src={post.thumbnail}
                    communityTitle={post.community.title}
                    className={FEED_THUMB_IMG_CLASSNAME}
                  />
                </a>
              ) : post.thumbnail ? (
                <div className="shrink-0">
                  <ImageLightbox
                    src={post.thumbnail}
                    alt=""
                    communityTitle={post.community.title}
                    className={FEED_THUMB_IMG_CLASSNAME}
                    fallbackClassName={FEED_THUMB_FALLBACK_CLASSNAME}
                  />
                </div>
              ) : (
                <CommunityLetterFallback
                  communityTitle={post.community.title}
                />
              )}

              </div>

              <div className="flex min-h-[5rem] min-w-0 flex-1 flex-col sm:min-h-[6rem]">
                <div className="flex-1">
                  <Link
                    href={sharePath}
                    className="text-stone-900 no-underline visited:text-stone-900 visited:no-underline dark:text-zinc-50 dark:visited:text-zinc-50"
                  >
                    <h2 className="text-lg font-semibold leading-snug hover:underline sm:text-xl">
                      {post.title}
                    </h2>
                  </Link>
                  {post.body && !isGenericBody(post.body) && (
                    <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">
                      {post.body}
                    </p>
                  )}
                </div>

                {/* Meta row — unchanged layout */}
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-sm dark:border-zinc-800">
                  <div className="min-w-0 truncate">
                    {!hideCommunity ? (
                      <Link
                        href={`/c/${post.community.name}`}
                        className="font-medium text-zinc-800 hover:underline dark:text-zinc-200"
                      >
                        {post.community.title}
                      </Link>
                    ) : post.nsfw ? (
                      <span className="font-medium text-rose-500">NSFW</span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <Link
                      href={`${sharePath}#comments`}
                      className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200"
                    >
                      <IconComments />
                      <span className="font-medium">{post._count.comments}</span>
                    </Link>
                    <SaveButton postId={post.id} iconOnly />
                    <ShareButton
                      url={sharePath}
                      title={post.title}
                      iconOnly
                    />
                    {!hideCommunity && post.nsfw && (
                      <span className="font-medium text-rose-500">NSFW</span>
                    )}
                  </div>
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
