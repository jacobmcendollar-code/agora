"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

export function CommunitiesList({ communities, isLoggedIn }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("active");

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

  function Row({ community }: { community: Community }) {
    return (
      <Link
        href={`/c/${community.name}`}
        className="flex items-start justify-between gap-4 border-b px-1 py-3 transition last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{community.title}</span>
            {community.joined && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                Joined
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
            {community.description}
          </p>
        </div>
        <div className="shrink-0 text-xs text-zinc-400">
          {community.postCount} post{community.postCount !== 1 ? "s" : ""}
        </div>
      </Link>
    );
  }

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
                Joined
              </h2>
              <div className="rounded-lg border bg-white dark:bg-zinc-900">
                <div className="divide-y dark:divide-zinc-800 px-3">
                  {joined.map((c) => (
                    <Row key={c.id} community={c} />
                  ))}
                </div>
              </div>
            </section>
          )}

          <section>
            {isLoggedIn && joined.length > 0 && (
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                All communities
              </h2>
            )}
            <div className="rounded-lg border bg-white dark:bg-zinc-900">
              <div className="divide-y dark:divide-zinc-800 px-3">
                {rest.map((c) => (
                  <Row key={c.id} community={c} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}