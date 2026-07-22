"use client";

import { useState } from "react";
import Link from "next/link";

type Community = {
  name: string;
  title: string;
};

type Props = {
  communities: Community[];
};

const INITIAL = 8;

export function JoinedCommunities({ communities }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (communities.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Not joined any communities yet.</p>
    );
  }

  const visible = expanded ? communities : communities.slice(0, INITIAL);
  const remaining = communities.length - INITIAL;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {visible.map((c) => (
          <Link
            key={c.name}
            href={`/c/${c.name}`}
            className="rounded-full border bg-white px-3 py-1 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {c.title}
          </Link>
        ))}
      </div>

      {!expanded && remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          +{remaining} more
        </button>
      )}

      {expanded && communities.length > INITIAL && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-3 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          Show less
        </button>
      )}
    </div>
  );
}