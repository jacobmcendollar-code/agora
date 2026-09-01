import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // serverActions is stable in 15, but keep flexible
  },
  images: {
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
    ];
  },
};

export default nextConfig;
