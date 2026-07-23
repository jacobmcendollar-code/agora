"use client";

import { useEffect } from "react";

type Props = {
  url: string;
};

export function XEmbed({ url }: Props) {
  useEffect(() => {
    // Wait for the Twitter widgets script to be ready, then force load
    const load = () => {
      if (window.twttr?.widgets) {
        window.twttr.widgets.load();
      }
    };

    // If the script is already loaded
    if (window.twttr) {
      load();
      return;
    }

    // Otherwise poll briefly until it appears
    const interval = setInterval(() => {
      if (window.twttr) {
        load();
        clearInterval(interval);
      }
    }, 100);

    // Safety timeout
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [url]);

  return (
    <div className="mt-4">
      <blockquote className="twitter-tweet" data-theme="dark">
        <a href={url}>Loading X post…</a>
      </blockquote>
    </div>
  );
}

// TypeScript helper
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}