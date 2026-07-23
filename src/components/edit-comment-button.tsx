"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  commentId: string;
  initialBody: string;
  createdAt: string;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export function EditCommentButton({
  commentId,
  initialBody,
  createdAt,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const age = Date.now() - new Date(createdAt).getTime();
  if (age > ONE_HOUR_MS) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        setLoading(false);
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-zinc-500 hover:underline"
      >
        Edit
      </button>
    );
  }

  return (
    <form onSubmit={handleSave} className="mt-2 space-y-2">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={10000}
        required
        className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setBody(initialBody);
            setError(null);
          }}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}