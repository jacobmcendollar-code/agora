"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function DeleteAccountPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not delete your account");
        setLoading(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Could not delete your account");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delete your account</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This permanently removes your profile, email, sessions, push token,
          saves, votes, and blocks. Your posts and comments stay in their
          threads as [deleted], with the text removed. This cannot be undone.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void onDelete()}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Delete my account"}
        </button>
        <Link
          href="/settings"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
