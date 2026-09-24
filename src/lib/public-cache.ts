/** Shared, non-personalized responses. Safe for every caller, including logged-in clients. */
export const PUBLIC_PREVIEW_CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=0, s-maxage=21600, stale-while-revalidate=604800",
  "CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=604800",
  "Vercel-CDN-Cache-Control":
    "public, s-maxage=21600, stale-while-revalidate=604800",
} as const;

/** Upstream HTML / oEmbed fetches. Identical for every user. */
export const UPSTREAM_FETCH_REVALIDATE_SECONDS = 60 * 60 * 6;
