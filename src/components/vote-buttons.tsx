"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Props = {
  targetType: "post" | "comment";
  targetId: string;
  initialScore: number;
  size?: "sm" | "md";
};

export function VoteButtons({
  targetType,
  targetId,
  initialScore,
  size = "md",
}: Props) {
  const { data: session } = useSession();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setUserVote(0);
      return;
    }

    fetch(`/api/vote/me?targetType=${targetType}&targetId=${targetId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.value === 1 || data.value === -1) {
          setUserVote(data.value);
        } else {
          setUserVote(0);
        }
      })
      .catch(() => {});
  }, [session?.user?.id, targetType, targetId]);

  async function vote(value: 1 | -1) {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    if (loading) return;

    const next = userVote === value ? 0 : value;
    setLoading(true);

    const prevVote = userVote;
    const prevScore = score;
    setUserVote(next);
    setScore(prevScore - prevVote + next);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, value: next }),
      });
      const data = await res.json();
      if (res.ok && typeof data.score === "number") {
        setScore(data.score);
      } else {
        setUserVote(prevVote);
        setScore(prevScore);
      }
    } catch {
      setUserVote(prevVote);
      setScore(prevScore);
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => vote(1)}
        disabled={loading}
        className={`rounded p-0.5 transition ${
          userVote === 1
            ? "text-orange-500"
            : "text-zinc-400 hover:text-orange-500"
        }`}
        aria-label="Upvote"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconSize}
        >
          <path d="M12 4l8 10H4L12 4z" />
        </svg>
      </button>

      <span
        className={`font-medium tabular-nums ${textSize} ${
          userVote === 1
            ? "text-orange-500"
            : userVote === -1
            ? "text-blue-500"
            : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {score}
      </span>

      <button
        type="button"
        onClick={() => vote(-1)}
        disabled={loading}
        className={`rounded p-0.5 transition ${
          userVote === -1
            ? "text-blue-500"
            : "text-zinc-400 hover:text-blue-500"
        }`}
        aria-label="Downvote"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconSize}
        >
          <path d="M12 20l-8-10h16L12 20z" />
        </svg>
      </button>
    </div>
  );
}