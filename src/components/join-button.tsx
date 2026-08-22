"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Props = {
  communityId: string;
  initialJoined: boolean;
  skipRefresh?: boolean;
  onToggle?: (joined: boolean) => void;
};

export function JoinButton({
  communityId,
  initialJoined,
  skipRefresh = false,
  onToggle,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId,
          action: joined ? "leave" : "join",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setJoined(data.joined);
        onToggle?.(data.joined);
        if (!skipRefresh) {
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        joined
          ? "border border-stone-300 bg-white text-zinc-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      } disabled:opacity-50`}
    >
      {loading ? "..." : joined ? "Joined" : "Join"}
    </button>
  );
}