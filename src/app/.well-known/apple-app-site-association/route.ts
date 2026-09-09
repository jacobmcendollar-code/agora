import { NextResponse } from "next/server";
import { APPLE_APP_SITE_ASSOCIATION } from "@/lib/apple-app-site-association";

export function GET() {
  return new NextResponse(JSON.stringify(APPLE_APP_SITE_ASSOCIATION), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
