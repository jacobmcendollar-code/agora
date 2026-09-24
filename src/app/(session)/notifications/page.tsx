"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { timeAgo } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
        // Mark all as read
        fetch("/api/notifications", { method: "PATCH" });
      })
      .catch(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="py-12 text-center text-zinc-500">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4">You need to be logged in to see notifications.</p>
        <Link href="/login" className="underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-zinc-500">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link}
              className={`block rounded-lg border p-4 transition hover:border-zinc-300 dark:hover:border-zinc-700 ${
                n.read
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-800/50"
              }`}
            >
              <p className="text-sm">{n.message}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {timeAgo(new Date(n.createdAt))}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}