"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatScore } from "@/lib/utils";

type Props = {
  targetType: "post" | "comment";
  targetId: string;
  initialScore: number;
  size?: "md" | "sm";
};

export function VoteButtons({ targetType, targetId, initialScore, size = "md" }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(null); // we don't hydrate current vote yet for simplicity
  const [loading, setLoading] = useState(false);

  async function vote(value: 1 | -1) {
    if (!session) {
      router.push("/login");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, value }),
      });

      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setUserVote(data.userVote);
      }
    } finally {
      setLoading(false);
    }
  }

  const btnClass =
    size === "sm"
      ? "h-6 w-6 text-xs"
      : "h-8 w-8 text-sm";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className={`${btnClass} flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          userVote === 1 ? "text-orange-500" : "text-zinc-400"
        }`}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span
        className={`font-medium tabular-nums ${
          size === "sm" ? "text-xs" : "text-sm"
        } ${score > 0 ? "text-zinc-900 dark:text-zinc-100" : score < 0 ? "text-blue-600" : "text-zinc-500"}`}
      >
        {formatScore(score)}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className={`${btnClass} flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          userVote === -1 ? "text-blue-500" : "text-zinc-400"
        }`}
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
}
