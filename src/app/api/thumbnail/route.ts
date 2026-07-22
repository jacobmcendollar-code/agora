import { NextResponse } from "next/server";
import { fetchThumbnail } from "@/lib/thumbnail";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ thumbnail: null });
  }

  try {
    const thumbnail = await fetchThumbnail(url);
    return NextResponse.json({ thumbnail });
  } catch {
    return NextResponse.json({ thumbnail: null });
  }
}