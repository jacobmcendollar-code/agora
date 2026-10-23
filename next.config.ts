import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Apex and www are the only live hosts. Mail is ImprovMX, not an HTTP
  // name under this zone, and certificate transparency lists only the apex,
  // www, and a wildcard. includeSubDomains does not point at an HTTP-only host.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://platform.twitter.com https://cdn.syndication.twimg.com https://www.youtube.com https://www.tiktok.com https://www.instagram.com https://embed.reddit.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.uploadthing.com https://utfs.io https://*.ufs.sh",
      "media-src 'self' blob: https:",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://platform.twitter.com https://syndication.twitter.com https://www.tiktok.com https://www.instagram.com https://embed.reddit.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // serverActions is stable in 15, but keep flexible
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
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
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
