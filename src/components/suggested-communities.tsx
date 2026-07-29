"use client";

import Link from "next/link";
import { JoinButton } from "@/components/join-button";

type Community = {
  id: string;
  name: string;
  title: string;
  description: string;
  _count: { subscriptions: number };
};

type Props = {
  communities: Community[];
};

export function SuggestedCommunities({ communities }: Props) {
  if (communities.length === 0) return null;

  return (
    <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900 sm:p-5">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Join a few communities</h2>
        <p className="mt-1 text-sm text-zinc-500">
          My Feed fills with posts from communities you join. Start with a few
          topics you care about.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {communities.map((community) => (
          <div
            key={community.id}
            className="flex items-start justify-between gap-3 rounded-lg border p-3 dark:border-zinc-700"
          >
            <div className="min-w-0">
              <Link
                href={`/c/${community.name}`}
                className="font-medium hover:underline"
              >
                {community.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {community.description}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {community._count.subscriptions} member
                {community._count.subscriptions === 1 ? "" : "s"}
              </p>
            </div>
            <div className="shrink-0">
              <JoinButton communityId={community.id} initialJoined={false} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/communities"
          className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          Browse all communities
        </Link>
      </div>
    </div>
  );
}