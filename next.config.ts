import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // serverActions is stable in 15, but keep flexible
  },
  images: {
    // Remote user and link thumbnails are plain <img> tags, so they skip the
    // optimizer. This only applies when /_next/image is used (the local logo).
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/agora-og-card.jpg",
        headers: [
          { key: "Content-Type", value: "image/jpeg" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/agora-og-card.png",
        headers: [
          { key: "Content-Type", value: "image/png" },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
