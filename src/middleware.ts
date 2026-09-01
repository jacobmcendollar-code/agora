import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isSocialCrawlerUserAgent,
  socialCrawlerHtml,
} from "@/lib/social-crawler";

export function middleware(request: NextRequest) {
  // Homepage only. Query strings such as ?v=4 are allowed; other paths pass through.
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  if (!isSocialCrawlerUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.next();
  }

  return new NextResponse(socialCrawlerHtml(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      Vary: "User-Agent",
    },
  });
}

export const config = {
  matcher: "/",
};
