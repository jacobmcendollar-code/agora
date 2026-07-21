"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Props = {
  communityId: string;
  initialJoined: boolean;
};

export function JoinButton({ communityId, initialJoined }: Props) {
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
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-md px-4 py-2 text-sm font-medium transition ${
        joined
          ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
      } disabled:opacity-50`}
    >
      {loading ? "..." : joined ? "Joined" : "Join"}
    </button>
  );
}