"use client";

import { useNsfw } from "@/components/nsfw-provider";

export function NsfwToggle() {
  const { showNsfw, setShowNsfw, ready } = useNsfw();

  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">Show NSFW</span>
        <span className="mt-1 block text-xs text-zinc-500">
          Show communities marked NSFW.
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={ready ? showNsfw : false}
        aria-label="Show NSFW"
        disabled={!ready}
        onClick={() => setShowNsfw(!showNsfw)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
          ready && showNsfw ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            ready && showNsfw ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
