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
    "rounded px-2 py-0.5 font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900";
  const inactive =
    "rounded px-2 py-0.5 font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <h2 className="text-lg font-semibold">
        {commentCount} comment{commentCount !== 1 ? "s" : ""}
      </h2>
      <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 bg-white p-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
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