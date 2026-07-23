import { NextResponse } from "next/server";
import { x_thread_fetch } from "@/tools"; // internal tool

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ title: "", thumbnail: null, description: "" });
  }

  // Special handling for X links
  if (url.includes("x.com") || url.includes("twitter.com")) {
    const postIdMatch = url.match(/\/status\/(\d+)/);
    const postId = postIdMatch ? postIdMatch[1] : null;

    if (postId) {
      try {
        const postData = await x_thread_fetch({ post_id: postId });
        if (postData) {
          const text = postData.text || "";
          const media = postData.media || [];
          const thumbnail = media.length > 0 ? media[0].url : null;

          return NextResponse.json({
            title: text.slice(0, 200),
            thumbnail,
            description: "X post",
            isX: true,
          });
        }
      } catch (e) {
        console.error("X fetch error", e);
      }
    }
  }

  // General Open Graph fallback
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AgoraBot/1.0)",
      },
    });

    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescriptionMatch = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

    const title = ogTitleMatch?.[1] || titleMatch?.[1] || "";
    const description = ogDescriptionMatch?.[1] || "";
    const thumbnail = ogImageMatch?.[1] || null;

    return NextResponse.json({
      title: title.trim(),
      thumbnail,
      description: description.trim(),
    });
  } catch {
    return NextResponse.json({ title: "", thumbnail: null, description: "" });
  }
}