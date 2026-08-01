"use client";

import { useEffect, useRef, useState } from "react";
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
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

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

  function close() {
    setOpen(false);
    setDragY(0);
    startY.current = null;
  }

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  }

  function onTouchEnd() {
    if (dragY > 80) {
      close();
    } else {
      setDragY(0);
    }
    startY.current = null;
  }

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
          style={{
            backgroundColor: `rgba(0,0,0,${Math.max(0.35, 0.8 - dragY / 400)})`,
          }}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative w-full max-w-lg transition-transform"
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