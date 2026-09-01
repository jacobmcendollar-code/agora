"use client";

import { useEffect, useState } from "react";

type Props = {
  videoId: string;
  thumbnail: string;
  title?: string;
  className?: string;
};

export function YouTubeLightbox({
  videoId,
  thumbnail,
  title = "",
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
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          decoding="async"
          className={
            className || "h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-32"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: `rgba(0,0,0,${Math.max(0.4, 0.9 - dragY / 400)})`,
          }}
          onClick={close}
        >
          <div
            className="relative w-full max-w-4xl"
            style={{ transform: `translateY(${dragY}px)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute -top-10 right-0 rounded-md bg-black/50 px-3 py-1.5 text-sm text-white hover:bg-black/70"
            >
              Close
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={title || "YouTube video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}