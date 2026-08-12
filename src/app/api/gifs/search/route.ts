import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GIPHY_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL("https://api.giphy.com/v1/gifs/search");
    url.searchParams.set("api_key", key);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "24");
    url.searchParams.set("rating", "pg-13");
    url.searchParams.set("lang", "en");

    const res = await fetch(url.toString(), {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("[gifs] Giphy error", res.status, await res.text());
      return NextResponse.json({ error: "GIF search failed" }, { status: 502 });
    }

    const data = await res.json();
    const results = (data.data || [])
      .map((item: any) => {
        const images = item.images || {};
        const url =
          images.fixed_height?.url ||
          images.downsized?.url ||
          images.original?.url;
        const preview =
          images.fixed_width_small?.url ||
          images.preview_gif?.url ||
          url;
        if (!url) return null;
        return {
          id: item.id as string,
          url: url as string,
          preview: (preview || url) as string,
          title: (item.title as string) || "",
        };
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[gifs] exception", err);
    return NextResponse.json({ error: "GIF search failed" }, { status: 500 });
  }
}