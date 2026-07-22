"use client";

import { useNsfw } from "@/components/nsfw-provider";

export function NsfwToggle() {
  const { showNsfw, setShowNsfw, ready } = useNsfw();

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={() => setShowNsfw(!showNsfw)}
      className="rounded-md px-2 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      title={showNsfw ? "Hide NSFW content" : "Show NSFW content"}
    >
      {showNsfw ? "NSFW on" : "NSFW off"}
    </button>
  );
}