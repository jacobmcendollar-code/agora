/**
 * Tries to extract an Open Graph image (thumbnail) from a URL.
 * Returns the image URL or null if it can't find one.
 */
export async function fetchThumbnail(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AgoraBot/1.0)",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Look for og:image
    const ogImageMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) || html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );

    if (ogImageMatch && ogImageMatch[1]) {
      let imageUrl = ogImageMatch[1].trim();

      // Handle relative URLs
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      } else if (imageUrl.startsWith("/")) {
        const base = new URL(url);
        imageUrl = base.origin + imageUrl;
      }

      return imageUrl;
    }

    return null;
  } catch {
    // If anything fails (timeout, network, etc.), just skip the thumbnail
    return null;
  }
}