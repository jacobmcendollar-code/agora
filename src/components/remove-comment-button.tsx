"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemoveCommentButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Remove this comment?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to remove comment");
        setLoading(false);
      }
    } catch {
      alert("Failed to remove comment");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50 dark:text-rose-400"
    >
      {loading ? "Removing…" : "Remove"}
    </button>
  );
}