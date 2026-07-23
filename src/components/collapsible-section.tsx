"use client";

import { useState } from "react";

type Props = {
  title: string;
  count?: number;
  previewCount?: number;
  children: React.ReactNode[];
  emptyMessage?: string;
};

export function CollapsibleSection({
  title,
  count,
  previewCount = 3,
  children,
  emptyMessage = "Nothing here yet.",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const items = children.filter(Boolean);
  const visible = expanded ? items : items.slice(0, previewCount);
  const hasMore = items.length > previewCount;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {title}
          {typeof count === "number" ? ` (${count})` : ""}
        </h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            {expanded ? "Show less" : `Show all ${items.length}`}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">{visible}</div>
      )}
    </section>
  );
}