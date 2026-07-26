"use client";

import { useEffect, useState } from "react";

type Props = {
  url: string;
  title?: string | null;
  thumbnail?: string | null;
  showDescription?: boolean;
};

type Preview = {
  title: string;
  description: string;
  thumbnail: string | null;
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

export function LinkPreviewCard({
  url,
  title,
  thumbnail,
  showDescription = true,
}: Props) {
  const [preview, setPreview] = useState<Preview>({
    title: title || "",
    description: "",
    thumbnail: thumbnail || null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url)}`
        );
        const data = await res.json();
        if (cancelled) return;

        setPreview({
          title: decodeHtmlEntities(data.title || title || getHostname(url)),
          description: decodeHtmlEntities(data.description || ""),
          thumbnail: data.thumbnail || thumbnail || null,
        });
      } catch {
        if (!cancelled) {
          setPreview((prev) => ({
            ...prev,
            title: prev.title || title || getHostname(url),
          }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, title, thumbnail]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl border bg-white transition hover:border-zinc-300 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {preview.thumbnail && (
        <div className="aspect-[1.91/1] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={preview.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="space-y-2 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {getHostname(url)}
        </div>

        <h2 className="text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
          {preview.title || "Untitled link"}
        </h2>

        {showDescription &&
          (loading ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ) : preview.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {preview.description}
            </p>
          ) : null)}

        <div className="pt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Read original →
        </div>
      </div>
    </a>
  );
}