"use client";

import { useState } from "react";
import { useToast } from "@/components/toast-provider";

type Props = {
  url: string;
  title: string;
  iconOnly?: boolean;
};

export function ShareButton({ url, title, iconOnly = false }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (loading) return;
    setLoading(true);
    const fullUrl = url.startsWith("http")
      ? url
      : `${typeof window !== "undefined" ? window.location.origin : "https://agor4.com"}${url}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title,
          url: fullUrl,
        });
        toast("Shared");
      } else if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(fullUrl);
        toast("Link copied");
      } else {
        const input = document.createElement("input");
        input.value = fullUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        toast("Link copied");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(fullUrl);
          toast("Link copied");
        } catch {
          toast("Could not share", "error");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      className={`inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200 ${
        iconOnly ? "text-sm" : "text-xs text-zinc-500 dark:hover:text-zinc-300"
      }`}
      aria-label="Share post"
      title="Share"
    >
      <svg
        className={iconOnly ? "h-4 w-4" : "h-3.5 w-3.5"}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      {!iconOnly && <span>Share</span>}
    </button>
  );
}