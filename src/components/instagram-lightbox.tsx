"use client";

import { useEffect, useState } from "react";
import { InstagramEmbed } from "@/components/instagram-embed";
import {
  FEED_THUMB_FALLBACK_CLASSNAME,
  ThumbImage,
} from "@/components/thumb-image";

type Props = {
  url: string;
  thumbnail: string;
  title: string;
  communityTitle?: string;
  className?: string;
};

export function InstagramLightbox({
  url,
  thumbnail,
  title,
  communityTitle = "",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    let startY: number | null = null;
    let currentDrag = 0;

    function onTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
      currentDrag = 0;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY == null) return;
      const delta = e.touches[0].clientY - startY;
      if (delta > 0) {
        currentDrag = delta;
        setDragY(delta);
        if (delta > 8) e.preventDefault();
      }
    }

    function onTouchEnd() {
      if (currentDrag > 80) {
        close();
      } else {
        setDragY(0);
      }
      startY = null;
      currentDrag = 0;
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setDragY(0);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0"
        aria-label={`Open Instagram post: ${title}`}
      >
        <ThumbImage
          src={thumbnail}
          communityTitle={communityTitle}
          alt=""
          className={className}
          fallbackClassName={FEED_THUMB_FALLBACK_CLASSNAME}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: `rgba(0,0,0,${Math.max(0.35, 0.8 - dragY / 400)})`,
          }}
          onClick={close}
        >
          <div
            className="relative w-full max-w-lg"
            style={{ transform: `translateY(${dragY}px)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
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