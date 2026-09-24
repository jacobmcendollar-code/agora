import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isSocialCrawlerUserAgent,
  socialCrawlerHtml,
} from "@/lib/social-crawler";
import { hasAuthSessionCookie } from "@/lib/session-cookie";

function isStaticAssetPath(pathname: string): boolean {
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/.well-known")
  ) {
    return true;
  }
  return /^\/(?:favicon\.ico|robots\.txt|sitemap\.xml|apple-icon(?:\.png)?|icon(?:\.png)?|.*\.(?:png|jpe?g|gif|webp|svg|ico|txt|xml|json|webmanifest))$/i.test(
    pathname
  );
}

function rewrite(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Matcher is already narrow. This keeps static, well-known, and public files
  // out of the social-card and logged-in rewrite work if the matcher changes.
  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (isSocialCrawlerUserAgent(request.headers.get("user-agent"))) {
      return new NextResponse(socialCrawlerHtml(), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=300",
          Vary: "User-Agent",
        },
      });
    }

    const sort = request.nextUrl.searchParams.get("sort");
    const altSort = sort === "recent" || sort === "top" || sort === "my";
    if (hasAuthSessionCookie(request) || altSort) {
      return rewrite(request, "/internal/home");
    }
    return NextResponse.next();
  }

  if (pathname === "/communities") {
    if (hasAuthSessionCookie(request)) {
      return rewrite(request, "/internal/communities");
    }
    return NextResponse.next();
  }

  const community = pathname.match(/^\/c\/([^/]+)$/);
  if (community) {
    const sort = request.nextUrl.searchParams.get("sort");
    const altSort = sort === "recent" || sort === "top";
    if (hasAuthSessionCookie(request) || altSort) {
      return rewrite(request, `/internal/c/${community[1]}`);
    }
    return NextResponse.next();
  }

  const post = pathname.match(/^\/c\/([^/]+)\/posts\/([^/]+)$/);
  if (post) {
    const sort = request.nextUrl.searchParams.get("sort");
    if (hasAuthSessionCookie(request) || sort === "newest") {
      return rewrite(request, `/internal/post/${post[1]}/${post[2]}`);
    }
    return NextResponse.next();
  }

  if (
    (pathname === "/about" || pathname === "/privacy") &&
    hasAuthSessionCookie(request)
  ) {
    return rewrite(request, `/internal${pathname}`);
  }

  return NextResponse.next();
}

export const config = {
  // Homepage social cards, plus anonymous-vs-logged-in rewrites.
  // Do not match _next/static, _next/image, images, favicon, icons,
  // robots, sitemap, .well-known, or other public files.
  matcher: [
    "/",
    "/communities",
    "/about",
    "/privacy",
    "/c/:name",
    "/c/:name/posts/:postId",
  ],
};
