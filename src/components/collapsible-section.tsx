"use client";

import { useState } from "react";

type Props = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold">
          {title}
          {typeof count === "number" ? ` (${count})` : ""}
        </h2>
        <span className="text-sm text-zinc-500">{open ? "Hide" : "Show"}</span>
      </button>
      {open && children}
    </section>
  );
}