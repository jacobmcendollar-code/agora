"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BLOCK_CONFIRM, UNBLOCK_CONFIRM } from "@/lib/block-copy";
import { useToast } from "@/components/toast-provider";

type Props = {
  userId: string;
  username: string;
  initialBlocked: boolean;
};

export function BlockButton({ userId, username, initialBlocked }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [blocked, setBlocked] = useState(initialBlocked);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!session) {
      router.push("/login");
      return;
    }

    const next = !blocked;
    const ok = window.confirm(next ? BLOCK_CONFIRM : UNBLOCK_CONFIRM);
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: next ? "block" : "unblock",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Something went wrong", "error");
        return;
      }
      setBlocked(Boolean(data.blocked));
      toast(data.blocked ? `Blocked ${username}` : `Unblocked ${username}`);
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
        blocked
          ? "border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
          : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {loading ? "…" : blocked ? "Unblock" : "Block"}
    </button>
  );
}
