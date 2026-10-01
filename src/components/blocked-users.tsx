"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UNBLOCK_CONFIRM } from "@/lib/block-copy";
import { useToast } from "@/components/toast-provider";

export type BlockedUser = {
  id: string;
  username: string;
  image: string | null;
};

export function BlockedUsers({ initial }: { initial: BlockedUser[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function unblock(user: BlockedUser) {
    const ok = window.confirm(UNBLOCK_CONFIRM);
    if (!ok) return;
    setBusyId(user.id);
    try {
      const res = await fetch("/api/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action: "unblock" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not unblock", "error");
        return;
      }
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      toast(`Unblocked ${user.username}`);
      router.refresh();
    } catch {
      toast("Could not unblock", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#161618]">
      <div>
        <p className="text-sm font-medium">Blocked users</p>
        <p className="mt-1 text-xs text-zinc-500">
          You won&apos;t see their posts or comments, and they can&apos;t reply to or mention you.
        </p>
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-zinc-500">You haven&apos;t blocked anyone.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3">
              <Link href={`/u/${user.username}`} className="flex min-w-0 items-center gap-3">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {user.username.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="truncate text-sm font-medium">{user.username}</span>
              </Link>
              <button
                type="button"
                disabled={busyId === user.id}
                onClick={() => void unblock(user)}
                className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                {busyId === user.id ? "…" : "Unblock"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
