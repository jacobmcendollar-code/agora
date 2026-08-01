"use client";

import Link from "next/link";

type Sort = "best" | "newest";

type Props = {
  basePath: string;
  sort: Sort;
  commentCount: number;
};

export function CommentSortTabs({ basePath, sort, commentCount }: Props) {
  const bestHref = basePath;
  const newestHref = `${basePath}?sort=newest`;

  const active =
    "rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900";
  const inactive =
    "rounded-md px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">
        {commentCount} comment{commentCount !== 1 ? "s" : ""}
      </h2>
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        <Link
          href={bestHref}
          className={sort === "best" ? active : inactive}
          scroll={false}
        >
          Best
        </Link>
        <Link
          href={newestHref}
          className={sort === "newest" ? active : inactive}
          scroll={false}
        >
          Newest
        </Link>
      </div>
    </div>
  );
}