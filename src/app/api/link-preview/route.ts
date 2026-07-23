import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ title: "", thumbnail: null, description: "" });
  }

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