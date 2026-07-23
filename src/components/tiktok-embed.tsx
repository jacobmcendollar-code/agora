"use client";

import { useEffect } from "react";

type Props = {
  url: string;
};

export function TikTokEmbed({ url }: Props) {
  useEffect(() => {
    // Load TikTok embed script if it isn't already present
    if (!document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Force TikTok to process the embed
    const interval = setInterval(() => {
      // @ts-ignore
      if (window.tiktokEmbed) {
        // @ts-ignore
        window.tiktokEmbed.lib.render();
        clearInterval(interval);
      }
    }, 150);

    const timeout = setTimeout(() => clearInterval(interval), 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [url]);

  return (
    <div className="mt-4">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={extractTikTokId(url) || undefined}
        style={{ maxWidth: "605px", minWidth: "325px" }}
      >
        <a href={url}>View on TikTok</a>
      </blockquote>
    </div>
  );
}

function extractTikTokId(url: string): string | null {
  try {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}