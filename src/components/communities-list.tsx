"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { JoinButton } from "@/components/join-button";

type Community = {
  id: string;
  name: string;
  title: string;
  description: string;
  createdAt: string;
  postCount: number;
  joined: boolean;
};

type SortKey = "az" | "active" | "newest";
type TabKey = "discover" | "joined";

type Props = {
  communities: Community[];
  isLoggedIn: boolean;
};

export function CommunitiesList({ communities, isLoggedIn }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("active");
  const [tab, setTab] = useState<TabKey>("discover");

  const filtered = useMemo(() => {
    let list = [...communities];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    if (sort === "az") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "active") {
      list.sort((a, b) => b.postCount - a.postCount);
    } else if (sort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return list;
  }, [communities, query, sort]);

  const joined = filtered.filter((c) => c.joined);
  const discover = isLoggedIn
    ? filtered.filter((c) => !c.joined)
    : filtered;

  const searching = Boolean(query.trim());
  const showBothTabs = isLoggedIn && searching;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communities..."
          className="w-full max-w-md rounded-lg border border-zinc-200 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700"
        />
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
          {(
            [
              { key: "active", label: "Most Active" },
              { key: "az", label: "A–Z" },
              { key: "newest", label: "Newest" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSort(option.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                sort === option.key
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoggedIn && !searching && (
        <div className="grid grid-cols-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setTab("discover")}
            className={`py-3 text-center text-sm font-medium transition ${
              tab === "discover"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-b-2 border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Discover
          </button>
          <button
            type="button"
            onClick={() => setTab("joined")}
            className={`py-3 text-center text-sm font-medium transition ${
              tab === "joined"
                ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-b-2 border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            Joined
            <span className="ml-1.5 text-xs text-zinc-500">{joined.length}</span>
          </button>
        </div>
      )}

      {showBothTabs ? (
        joined.length === 0 && discover.length === 0 ? (
          <EmptyState message="No communities match your search." />
        ) : (
          <div className="space-y-8">
            <ResultSection
              title="Joined"
              communities={joined}
              isLoggedIn={isLoggedIn}
              empty="No joined communities match your search."
            />
            <ResultSection
              title="Discover"
              communities={discover}
              isLoggedIn={isLoggedIn}
              empty="No communities match your search."
            />
          </div>
        )
      ) : tab === "joined" && isLoggedIn ? (
        joined.length === 0 ? (
          <EmptyState
            message={
              query
                ? "No joined communities match your search."
                : "You haven’t joined any communities yet."
            }
          />
        ) : (
          <CommunityGrid communities={joined} isLoggedIn={isLoggedIn} />
        )
      ) : discover.length === 0 ? (
        <EmptyState
          message={
            query ? "No communities match your search." : "No communities to show."
          }
        />
      ) : (
        <CommunityGrid communities={discover} isLoggedIn={isLoggedIn} />
      )}
    </div>
  );
}

function ResultSection({
  title,
  communities,
  isLoggedIn,
  empty,
}: {
  title: string;
  communities: Community[];
  isLoggedIn: boolean;
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
        <span className="ml-1.5 text-xs">{communities.length}</span>
      </h2>
      {communities.length === 0 ? (
        <EmptyState message={empty} />
      ) : (
        <CommunityGrid communities={communities} isLoggedIn={isLoggedIn} />
      )}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
      {message}
    </div>
  );
}

function CommunityGrid({
  communities,
  isLoggedIn,
}: {
  communities: Community[];
  isLoggedIn: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {communities.map((community) => (
        <div
          key={community.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-600"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/c/${community.name}`}
                className="text-base font-semibold hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {community.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {community.description}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                {community.postCount} post
                {community.postCount !== 1 ? "s" : ""}
              </p>
            </div>
            {isLoggedIn && (
              <div className="shrink-0">
                <JoinButton
                  communityId={community.id}
                  initialJoined={community.joined}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
