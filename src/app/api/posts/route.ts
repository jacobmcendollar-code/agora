import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateContent } from "@/lib/moderation";
import { fetchThumbnail } from "@/lib/thumbnail";

const schema = z.object({
  communityName: z.string().min(1),
  title: z.string().min(1).max(300),
  body: z.string().max(40000).optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal("")),
  imageUrl: z.string().url().optional().nullable(),
  nsfw: z.boolean().optional().default(false),
});

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

async function fetchLinkDescription(url: string): Promise<string | null> {
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
        return decodeHtmlEntities(
          match[1].trim().replace(/\s+/g, " ")
        ).slice(0, 300);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
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

    const { communityName, title, body: postBody, url, imageUrl, nsfw } =
      parsed.data;

    const community = await prisma.community.findUnique({
      where: { name: communityName },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
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
    if (!thumbnail && url) {
      thumbnail = await fetchThumbnail(url);
    }

    let finalBody = postBody?.trim() || null;
    if (!finalBody && url) {
      finalBody = await fetchLinkDescription(url);
    }

    const post = await prisma.post.create({
      data: {
        title,
        body: finalBody,
        url: url || null,
        thumbnail,
        nsfw: nsfw || community.nsfw || false,
        communityId: community.id,
        authorId: session.user.id,
        moderationStatus: "approved",
        score: 1,
      },
    });

    await prisma.postVote.create({
      data: {
        value: 1,
        userId: session.user.id,
        postId: post.id,
      },
    });

    return NextResponse.json({ id: post.id, communityName: community.name });
  } catch (err) {
    console.error("[posts POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}