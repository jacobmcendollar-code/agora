"use client";

import { useEffect, useRef } from "react";

type Props = {
  url: string;
};

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export function InstagramEmbed({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const blockquote = document.createElement("blockquote");
    blockquote.className = "instagram-media";
    blockquote.setAttribute("data-instgrm-permalink", url);
    blockquote.setAttribute("data-instgrm-version", "14");
    blockquote.style.margin = "0 auto";
    blockquote.style.maxWidth = "540px";
    blockquote.style.width = "100%";

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = "View on Instagram";
    blockquote.appendChild(anchor);

    containerRef.current.appendChild(blockquote);

    function processEmbeds() {
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    }

    const existing = document.querySelector(
      'script[src="https://www.instagram.com/embed.js"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      processEmbeds();
      const t1 = window.setTimeout(processEmbeds, 300);
      const t2 = window.setTimeout(processEmbeds, 1000);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => processEmbeds();
    document.body.appendChild(script);

    const t1 = window.setTimeout(processEmbeds, 500);
    const t2 = window.setTimeout(processEmbeds, 1500);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [url]);

  return (
    <div className="mt-4 overflow-hidden rounded-lg">
      <div ref={containerRef} />
    </div>
  );
}