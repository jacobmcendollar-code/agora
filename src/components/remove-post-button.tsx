"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RemovePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm("Remove this post? It will no longer appear on the site.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Failed to remove post");
        setLoading(false);
      }
    } catch {
      alert("Failed to remove post");
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
      {loading ? "Removing…" : "Remove post"}
    </button>
  );
}