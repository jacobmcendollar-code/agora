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
};

export default nextConfig;
