/**
 * Tries to extract a thumbnail from a URL.
 * Special handling for YouTube and TikTok.
 */
export async function fetchThumbnail(url: string): Promise<string | null> {
  try {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch?.[1]) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
    }

    // TikTok via oEmbed
    if (url.includes("tiktok.com")) {
      try {
        const oembedRes = await fetch(
          `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; AgoraBot/1.0)",
            },
          }
        );
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          if (data.thumbnail_url) {
            return data.thumbnail_url as string;
          }
        }
      } catch {
        // fall through to general OG fetch
      }
    }

    // General Open Graph
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        let imageUrl = match[1].trim();
        if (imageUrl.startsWith("//")) {
          imageUrl = "https:" + imageUrl;
        } else if (imageUrl.startsWith("/")) {
          const base = new URL(url);
          imageUrl = base.origin + imageUrl;
        }
        return imageUrl;
      }
    }

    return null;
  } catch {
    return null;
  }
}