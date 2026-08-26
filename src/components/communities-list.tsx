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

const JOINED_PREVIEW = 8;

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
    <div className="space-y-10">
      {/* Search + green sort tabs */}
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No communities match your search.
        </div>
      ) : (
        <>
          {/* Joined pills */}
          {isLoggedIn && joined.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  Joined
                </h2>
                <span className="text-xs text-zinc-500">{joined.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleJoined.map((community) => (
                  <Link
                    key={community.id}
                    href={`/c/${community.name}`}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                  >
                    {community.title}
                  </Link>
                ))}
              </div>
              {!joinedExpanded && hiddenJoinedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setJoinedExpanded(true)}
                  className="mt-3 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                >
                  Show {hiddenJoinedCount} more
                </button>
              )}
              {joinedExpanded && joined.length > JOINED_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setJoinedExpanded(false)}
                  className="mt-3 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                >
                  Show less
                </button>
              )}
            </section>
          )}

          {/* Discover — two columns */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Discover
              </h2>
            </div>

            {rest.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                You’re in every community that matches this search.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rest.map((community) => (
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
                            initialJoined={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}