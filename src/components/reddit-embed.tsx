"use client";

import { useEffect } from "react";

type Props = {
  url: string;
};

export function RedditEmbed({ url }: Props) {
  useEffect(() => {
    // Load Reddit embed script if needed
    if (!document.querySelector('script[src="https://embed.reddit.com/widgets.js"]')) {
      const script = document.createElement("script");
      script.src = "https://embed.reddit.com/widgets.js";
      script.async = true;
      script.setAttribute("charset", "UTF-8");
      document.body.appendChild(script);
    }

    // Force Reddit widgets to load
    const interval = setInterval(() => {
      // @ts-ignore
      if (window.rembeddit) {
        // @ts-ignore
        window.rembeddit.init();
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
      <blockquote className="reddit-embed-bq" data-embed-height="480">
        <a href={url}>View on Reddit</a>
      </blockquote>
    </div>
  );
}