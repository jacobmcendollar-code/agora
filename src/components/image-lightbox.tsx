"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt?: string;
  className?: string;
};

export function ImageLightbox({ src, alt = "", className }: Props) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

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
        className="block cursor-zoom-in text-left"
      >
        <img
          src={src}
          alt={alt}
          className={
            className ||
            "max-h-80 w-full rounded-lg object-cover transition hover:opacity-95"
          }
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          style={{
            backgroundColor: `rgba(0,0,0,${Math.max(0.4, 0.9 - dragY / 400)})`,
          }}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw] transition-transform"
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
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain"
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
}