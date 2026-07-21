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
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { communityName, title, body: postBody, url } = parsed.data;

    if (!postBody && !url) {
      return NextResponse.json(
        { error: "Post must have either a body or a URL" },
        { status: 400 }
      );
    }

    const community = await prisma.community.findUnique({
      where: { name: communityName },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // AI moderation
    const moderation = await moderateContent({
      type: "post",
      title,
      body: postBody || url || "",
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

    // Try to get a thumbnail if there's a URL
    let thumbnail: string | null = null;
    if (url) {
      thumbnail = await fetchThumbnail(url);
    }

    const post = await prisma.post.create({
      data: {
        title,
        body: postBody || null,
        url: url || null,
        thumbnail,
        communityId: community.id,
        authorId: session.user.id,
        moderationStatus: "approved",
      },
    });

    return NextResponse.json({ id: post.id, communityName: community.name });
  } catch (err) {
    console.error("[posts POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}