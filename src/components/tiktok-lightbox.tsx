"use client";

import { useEffect, useState } from "react";
import { TikTokEmbed } from "@/components/tiktok-embed";
import {
  FEED_THUMB_FALLBACK_CLASSNAME,
  FEED_THUMB_IMG_CLASSNAME,
  ThumbImage,
} from "@/components/thumb-image";

type Props = {
  url: string;
  thumbnail: string;
  title?: string;
  communityTitle?: string;
  className?: string;
};

export function TikTokLightbox({
  url,
  thumbnail,
  title: _title = "",
  communityTitle = "",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
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
        className="relative block shrink-0 cursor-pointer text-left"
      >
        <ThumbImage
          src={thumbnail}
          communityTitle={communityTitle}
          alt=""
          className={className || FEED_THUMB_IMG_CLASSNAME}
          fallbackClassName={FEED_THUMB_FALLBACK_CLASSNAME}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white">
            ▶
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center p-4"
          style={{
            backgroundColor: `rgba(0,0,0,${Math.max(0.4, 0.9 - dragY / 400)})`,
            paddingTop: "max(1rem, env(safe-area-inset-top))",
          }}
          onClick={close}
        >
          <div
            className="flex w-full max-w-md shrink-0 justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="rounded-md bg-black/50 px-3 py-2 text-sm text-white hover:bg-black/70"
            >
              Close
            </button>
          </div>
          <div
            className="relative mt-3 flex min-h-0 w-full max-w-md flex-1 items-start justify-center overflow-hidden"
            style={{ transform: `translateY(${dragY}px)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-full w-full overflow-hidden">
              <TikTokEmbed url={url} compact />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
