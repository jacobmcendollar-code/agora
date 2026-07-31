"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast-provider";

type Props = {
  userId: string;
  username: string;
  initialMuted: boolean;
};

export function MuteButton({ userId, username, initialMuted }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [muted, setMuted] = useState(initialMuted);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!session) {
      router.push("/login");
      return;
    }

    const next = !muted;
    const ok = window.confirm(
      next
        ? `Hide posts and comments from ${username} across Agora?`
        : `Show posts and comments from ${username} again?`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: next ? "mute" : "unmute",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Something went wrong", "error");
        return;
      }
      setMuted(data.muted);
      toast(data.muted ? `Muted ${username}` : `Unmuted ${username}`);
      router.refresh();
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
        muted
          ? "border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {loading ? "…" : muted ? "Unmute" : "Mute"}
    </button>
  );
}