import type { MetadataRoute } from "next";

const PRIVATE_PATHS = ["/api/", "/search", "/internal/"];

const ALLOWED_CRAWLERS = [
  "Googlebot",
  "Bingbot",
  "Twitterbot",
  "facebookexternalhit",
  "DuckDuckBot",
];

const BLOCKED_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "Bytespider",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Amazonbot",
  "meta-externalagent",
  "Applebot-Extended",
  "Google-Extended",
  "ImagesiftBot",
  "Diffbot",
  "omgili",
  "Omgilibot",
  "FacebookBot",
  "cohere-ai",
  "img2dataset",
  "Timpibot",
  "DataForSeoBot",
  "SemrushBot",
  "AhrefsBot",
  "MJ12bot",
  "DotBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...ALLOWED_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
      {
        userAgent: BLOCKED_CRAWLERS,
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
  };
}
