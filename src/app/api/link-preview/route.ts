import { NextResponse } from "next/server";

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ title: "", thumbnail: null, description: "" });
  }

  // X / Twitter: never suggest a title
  if (url.includes("x.com") || url.includes("twitter.com")) {
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
      const res = await fetch(oembedUrl);
      const data = await res.json();
      return NextResponse.json({
        title: "",
        thumbnail: null,
        description: "",
        html: data.html || "",
      });
    } catch {
      return NextResponse.json({
        title: "",
        thumbnail: null,
        description: "",
      });
    }
  }

  // YouTube: use oEmbed for the real video title + thumbnail
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AgoraBot/1.0)",
        },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          title: (data.title || "").trim(),
          thumbnail:
            data.thumbnail_url ||
            `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
          description: "",
        });
      }
    } catch {
      // fall through to generic handler
    }

    // Fallback if oEmbed fails
    return NextResponse.json({
      title: "",
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      description: "",
    });
  }

  // General fallback for other sites
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch =
      html.match(
        /property=["']og:title["'][^>]*content=["']([^"']+)["']/i
      ) ||
      html.match(
        /content=["']([^"']+)["'][^>]*property=["']og:title["']/i
      );
    const ogDescriptionMatch =
      html.match(
        /property=["']og:description["'][^>]*content=["']([^"']+)["']/i
      ) ||
      html.match(
        /content=["']([^"']+)["'][^>]*property=["']og:description["']/i
      );
    const ogImageMatch =
      html.match(
        /property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      ) ||
      html.match(
        /content=["']([^"']+)["'][^>]*property=["']og:image["']/i
      );

    let title = (ogTitleMatch?.[1] || titleMatch?.[1] || "").trim();

    // Clean common junk like " - YouTube"
    title = title.replace(/\s*[-|]\s*YouTube\s*$/i, "").trim();

    const description = (ogDescriptionMatch?.[1] || "").trim();
    const thumbnail = ogImageMatch?.[1] || null;

    return NextResponse.json({
      title,
      thumbnail,
      description,
    });
  } catch {
    return NextResponse.json({ title: "", thumbnail: null, description: "" });
  }
}