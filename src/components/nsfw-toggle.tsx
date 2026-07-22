"use client";

import { useNsfw } from "@/components/nsfw-provider";

export function NsfwToggle() {
  const { showNsfw, setShowNsfw, ready } = useNsfw();

  if (!ready) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-600 dark:text-zinc-300">Show NSFW</span>
      <button
        type="button"
        role="switch"
        aria-checked={showNsfw}
        onClick={() => setShowNsfw(!showNsfw)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          showNsfw ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            showNsfw ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}