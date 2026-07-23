"use client";

import { useEffect, useState } from "react";
import { TikTokEmbed } from "@/components/tiktok-embed";

type Props = {
  url: string;
  thumbnail: string;
  title?: string;
  className?: string;
};

export function TikTokLightbox({
  url,
  thumbnail,
  title = "",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block shrink-0 cursor-pointer text-left"
      >
        <img
          src={thumbnail}
          alt={title}
          className={
            className ||
            "h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-32"
          }
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white">
            ▶
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-md bg-black/50 px-3 py-1.5 text-sm text-white hover:bg-black/70"
          >
            Close
          </button>

          <div
            className="max-h-[90vh] w-full max-w-md overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <TikTokEmbed url={url} />
          </div>
        </div>
      )}
    </>
  );
}