"use client";

import { useEffect, useRef } from "react";

type Props = {
  url: string;
};

export function RedditEmbed({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous content
    containerRef.current.innerHTML = "";

    // Create the blockquote Reddit expects
    const blockquote = document.createElement("blockquote");
    blockquote.className = "reddit-embed-bq";
    blockquote.setAttribute("data-embed-height", "500");

    const link = document.createElement("a");
    link.href = url;
    link.textContent = "View on Reddit";
    blockquote.appendChild(link);

    containerRef.current.appendChild(blockquote);

    // Remove any existing Reddit embed script so we can force a fresh load
    const existing = document.querySelector(
      'script[src="https://embed.reddit.com/widgets.js"]'
    );
    if (existing) {
      existing.remove();
    }

    // Inject a fresh script
    const script = document.createElement("script");
    script.src = "https://embed.reddit.com/widgets.js";
    script.async = true;
    script.setAttribute("charset", "UTF-8");
    document.body.appendChild(script);
  }, [url]);

  return <div className="mt-4" ref={containerRef} />;
}