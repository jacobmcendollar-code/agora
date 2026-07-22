"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "agora-welcome-dismissed";

export function WelcomeBanner() {
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (session) {
      setVisible(false);
      return;
    }
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setVisible(!dismissed);
  }, [session, status]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-zinc-800 dark:text-zinc-200">
          <p className="font-medium">Welcome to Agora</p>
          <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
            Open discussion with light moderation — spam and off-topic only.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/communities"
              className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              Browse communities
            </Link>
            <Link
              href="/about"
              className="font-medium text-zinc-600 hover:underline dark:text-zinc-400"
            >
              About
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-emerald-100 hover:text-zinc-800 dark:hover:bg-emerald-900 dark:hover:text-zinc-200"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}