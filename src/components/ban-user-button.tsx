"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  username: string;
  initialBanned: boolean;
};

export function BanUserButton({ userId, username, initialBanned }: Props) {
  const router = useRouter();
  const [banned, setBanned] = useState(initialBanned);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !banned;
    const message = next
      ? `Ban ${username}? They will not be able to post or comment.`
      : `Unban ${username}?`;

    if (!confirm(message)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, banned: next }),
      });

      if (res.ok) {
        setBanned(next);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed");
      }
    } catch {
      alert("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium hover:underline disabled:opacity-50 ${
        banned
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
    >
      {loading ? "…" : banned ? "Unban" : "Ban"}
    </button>
  );
}