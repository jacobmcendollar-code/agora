"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  commentId: string;
  createdAt: string;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export function DeleteCommentButton({ commentId, createdAt }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const age = Date.now() - new Date(createdAt).getTime();
  const isHard = age <= ONE_HOUR_MS;

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}/delete`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete");
        setLoading(false);
        setConfirming(false);
        return;
      }

      setConfirming(false);
      router.refresh();
    } catch {
      alert("Something went wrong");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="text-zinc-500">
        {isHard ? "Delete permanently?" : "Hide username?"}
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {loading ? "…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-zinc-500 hover:underline"
      >
        Cancel
      </button>
    </span>
  );
}