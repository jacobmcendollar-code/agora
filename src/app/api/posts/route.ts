import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";
import { moderateContent } from "@/lib/moderation";
import { fetchThumbnail } from "@/lib/thumbnail";

const schema = z.object({
  communityName: z.string().min(1),
  title: z.string().min(1).max(300),
  body: z.string().max(40000).optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal("")),
  imageUrl: z.string().url().optional().nullable(),
});

const GENERIC_DESCRIPTIONS = [
  "enjoy the videos and music you love",
  "upload original content, and share it all",
  "this site requires javascript",
];

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function isGenericDescription(text: string) {
  const lower = text.toLowerCase();
  return GENERIC_DESCRIPTIONS.some((g) => lower.includes(g));
}

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

async function fetchLinkDescription(url: string): Promise<string | null> {
  if (getYouTubeId(url)) {
    return null;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AgoraBot/1.0; +https://agor4.com)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    const patterns = [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const cleaned = decodeHtmlEntities(
          match[1].trim().replace(/\s+/g, " ")
        ).slice(0, 300);
        if (!cleaned || isGenericDescription(cleaned)) {
          return null;
        }
        return cleaned;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true },
  });
  if (dbUser?.banned) {
    return NextResponse.json(
      { error: "Your account is restricted from posting." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { communityName, title, body: postBody, url, imageUrl } = parsed.data;

    const community = await prisma.community.findUnique({
      where: { name: communityName },
    });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const linkUrl = typeof url === "string" ? url.trim() : "";
    const hasLink = !!linkUrl;
    const hasImage = !!imageUrl;
    const format = community.postFormat || "any";

    if (format === "discussion" && (hasLink || hasImage)) {
      return NextResponse.json(
        { error: "This community is discussion only" },
        { status: 400 }
      );
    }
    if (format === "media" && !hasLink && !hasImage) {
      return NextResponse.json(
        { error: "This community only accepts links and images" },
        { status: 400 }
      );
    }

    if (linkUrl) {
      const existing = await prisma.post.findFirst({
        where: {
          url: linkUrl,
          communityId: community.id,
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          community: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        return NextResponse.json(
          {
            error: "This link was already posted.",
            existingPostId: existing.id,
            communityName: existing.community.name,
          },
          { status: 409 }
        );
      }
    }

    const contentForModeration =
      [title, postBody, url].filter(Boolean).join("\n") || "[Image post]";

    const moderation = await moderateContent({
      type: "post",
      title,
      body: contentForModeration,
      communityName: community.name,
      communityDescription: community.description,
      communityRules: community.rules,
      communityNsfw: community.nsfw,
    });

    if (!moderation.allowed) {
      return NextResponse.json(
        {
          error: moderation.reason || "Post rejected by moderator",
          moderated: true,
        },
        { status: 403 }
      );
    }

    let thumbnail: string | null = imageUrl || null;
    if (!thumbnail && linkUrl) {
      thumbnail = await fetchThumbnail(linkUrl);
    }

    let finalBody: string | null = null;
    if (linkUrl) {
      finalBody = await fetchLinkDescription(linkUrl);
    } else {
      finalBody = postBody?.trim() || null;
    }

    const post = await prisma.post.create({
      data: {
        title,
        body: finalBody,
        url: linkUrl || null,
        thumbnail,
        nsfw: community.nsfw,
        communityId: community.id,
        authorId: userId,
        moderationStatus: "approved",
        score: 1,
      },
    });

    await prisma.postVote.create({
      data: {
        value: 1,
        userId,
        postId: post.id,
      },
    });

    return NextResponse.json({ id: post.id, communityName: community.name });
  } catch (err) {
    console.error("[posts POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}