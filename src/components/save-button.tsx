"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Props = {
  postId: string;
  initialSaved?: boolean;
};

export function SaveButton({ postId, initialSaved = false }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    fetch(`/api/posts/${postId}/save`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSaved(!!data.saved);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [postId, status]);

  async function toggleSave() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    setLoading(true);
    const previous = saved;
    setSaved(!previous);

    try {
      const res = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setSaved(previous);
        return;
      }

      setSaved(!!data.saved);
    } catch {
      setSaved(previous);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={loading}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-300"
      aria-label={saved ? "Unsave post" : "Save post"}
    >
      <svg
        className="h-3.5 w-3.5"
        fill={saved ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}