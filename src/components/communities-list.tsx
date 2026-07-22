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

type Props = {
  communities: Community[];
  isLoggedIn: boolean;
};

const JOINED_PREVIEW = 3;

export function CommunitiesList({ communities, isLoggedIn }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("active");
  const [joinedExpanded, setJoinedExpanded] = useState(false);

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
  const rest = isLoggedIn ? filtered.filter((c) => !c.joined) : filtered;
  const visibleJoined = joinedExpanded
    ? joined
    : joined.slice(0, JOINED_PREVIEW);
  const hiddenJoinedCount = Math.max(0, joined.length - JOINED_PREVIEW);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communities..."
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 sm:max-w-xs"
        />
        <div className="flex gap-1 rounded-lg border p-1 dark:border-zinc-700">
          {(
            [
              { key: "active", label: "Most active" },
              { key: "az", label: "A–Z" },
              { key: "newest", label: "Newest" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSort(option.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                sort === option.key
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-zinc-500">
          No communities match your search.
        </div>
      ) : (
        <>
          {isLoggedIn && joined.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Joined ({joined.length})
              </h2>
              <div className="rounded-lg border bg-white dark:bg-zinc-900">
                <div className="divide-y dark:divide-zinc-800">
                  {visibleJoined.map((community) => (
                    <div
                      key={community.id}
                      className="flex items-center justify-between gap-3 px-3 py-3"
                    >
                      <Link
                        href={`/c/${community.name}`}
                        className="min-w-0 flex-1 hover:underline"
                      >
                        <div className="font-medium">{community.title}</div>
                        <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                          {community.description}
                        </p>
                      </Link>
                      <div className="shrink-0 text-xs text-zinc-400">
                        {community.postCount} post
                        {community.postCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {!joinedExpanded && hiddenJoinedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setJoinedExpanded(true)}
                  className="mt-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                >
                  Show {hiddenJoinedCount} more
                </button>
              )}
              {joinedExpanded && joined.length > JOINED_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setJoinedExpanded(false)}
                  className="mt-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                >
                  Show less
                </button>
              )}
            </section>
          )}

          <section>
            {isLoggedIn && joined.length > 0 && (
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Discover
              </h2>
            )}
            <div className="rounded-lg border bg-white dark:bg-zinc-900">
              <div className="divide-y dark:divide-zinc-800">
                {rest.map((community) => (
                  <div
                    key={community.id}
                    className="flex items-center justify-between gap-3 px-3 py-3"
                  >
                    <Link
                      href={`/c/${community.name}`}
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <div className="font-medium">{community.title}</div>
                      <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                        {community.description}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-xs text-zinc-400 sm:inline">
                        {community.postCount} post
                        {community.postCount !== 1 ? "s" : ""}
                      </span>
                      {isLoggedIn && (
                        <JoinButton
                          communityId={community.id}
                          initialJoined={false}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}