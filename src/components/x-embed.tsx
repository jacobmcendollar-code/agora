"use client";

import { useEffect, useRef } from "react";

type Props = {
  url: string;
};

export function XEmbed({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40; // ~8 seconds

    function tryLoad() {
      if (cancelled || !containerRef.current) return;

      // Ensure the widgets script exists
      if (!document.querySelector('script[src*="platform.twitter.com/widgets.js"]')) {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.charset = "utf-8";
        document.body.appendChild(script);
      }

      // @ts-ignore
      const twttr = window.twttr;

      if (twttr?.widgets?.load) {
        twttr.widgets.load(containerRef.current);
        return;
      }

      // @ts-ignore
      if (twttr?.ready) {
        // @ts-ignore
        twttr.ready(() => {
          if (!cancelled && containerRef.current) {
            // @ts-ignore
            window.twttr.widgets.load(containerRef.current);
          }
        });
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tryLoad, 200);
      }
    }

    // Small delay helps mobile Safari after navigation / lightbox open
    const start = setTimeout(tryLoad, 150);

    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [url]);

  return (
    <div ref={containerRef} className="mt-4 overflow-hidden">
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
        <a href={url}>View post on X</a>
      </blockquote>
    </div>
  );
}

declare global {
  interface Window {
    twttr?: {
      ready?: (cb: () => void) => void;
      widgets: {
        load: (element?: HTMLElement | null) => void;
      };
    };
  }
}