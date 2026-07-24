"use client";

import { useEffect, useState } from "react";
import { InstagramEmbed } from "@/components/instagram-embed";

type Props = {
  url: string;
  thumbnail: string;
  title: string;
  className?: string;
};

export function InstagramLightbox({
  url,
  thumbnail,
  title,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0"
        aria-label={`Open Instagram post: ${title}`}
      >
        <img src={thumbnail} alt="" className={className} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-2 ml-auto block rounded-md bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
            >
              Close
            </button>
            <div className="max-h-[85vh] overflow-y-auto rounded-lg bg-white p-2 dark:bg-zinc-900">
              <InstagramEmbed url={url} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}