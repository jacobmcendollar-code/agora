import { NextResponse } from "next/server";
import { fetchThumbnail } from "@/lib/thumbnail";
import { PUBLIC_PREVIEW_CACHE_HEADERS } from "@/lib/public-cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { thumbnail: null },
      { headers: PUBLIC_PREVIEW_CACHE_HEADERS }
    );
  }

  try {
    const thumbnail = await fetchThumbnail(url);
    return NextResponse.json(
      { thumbnail },
      { headers: PUBLIC_PREVIEW_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { thumbnail: null },
      { headers: PUBLIC_PREVIEW_CACHE_HEADERS }
    );
  }
}