"use client";

import { useEffect, useState } from "react";
import { XEmbed } from "@/components/x-embed";

type Props = {
  url: string;
  thumbnail: string;
  title?: string;
  className?: string;
};

export function XLightbox({
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
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 rounded-md bg-black/50 px-3 py-1.5 text-sm text-white hover:bg-black/70"
            >
              Close
            </button>
            <div className="max-h-[90vh] overflow-auto rounded-lg bg-black p-2">
              <XEmbed url={url} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}