"use client";

import { useEffect, useState } from "react";

export const FEED_THUMB_IMG_CLASSNAME =
  "h-20 w-20 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-zinc-700 sm:h-24 sm:w-32";

export const FEED_THUMB_FALLBACK_CLASSNAME =
  "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-zinc-700 sm:h-24 sm:w-32";

export function communityThumbLabel(title: string): { text: string; large: boolean } {
  const trimmed = title.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length <= 12) {
    return { text: words[0], large: false };
  }
  const letter = (words[0]?.[0] || trimmed[0] || "?").toUpperCase();
  return { text: letter, large: true };
}

type LetterFallbackProps = {
  communityTitle: string;
  className?: string;
};

export function CommunityLetterFallback({
  communityTitle,
  className = FEED_THUMB_FALLBACK_CLASSNAME,
}: LetterFallbackProps) {
  const label = communityThumbLabel(communityTitle);
  return (
    <div
      className={className}
      style={{ backgroundColor: "#1a1a1d" }}
      aria-hidden="true"
    >
      <span
        className={
          label.large
            ? "select-none whitespace-nowrap font-semibold leading-none text-emerald-500 text-[32px]"
            : "select-none whitespace-nowrap font-semibold leading-none text-emerald-500 text-[14px]"
        }
      >
        {label.text}
      </span>
    </div>
  );
}

type ThumbImageProps = {
  src?: string | null;
  communityTitle: string;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
};

export function ThumbImage({
  src,
  communityTitle,
  className,
  fallbackClassName = FEED_THUMB_FALLBACK_CLASSNAME,
  alt = "",
}: ThumbImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = src || null;

  useEffect(() => {
    setFailedSrc(null);
  }, [resolvedSrc]);

  if (!resolvedSrc || failedSrc === resolvedSrc) {
    return (
      <CommunityLetterFallback
        communityTitle={communityTitle}
        className={fallbackClassName}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={(event) => {
        event.currentTarget.style.display = "none";
        setFailedSrc(resolvedSrc);
      }}
    />
  );
}
