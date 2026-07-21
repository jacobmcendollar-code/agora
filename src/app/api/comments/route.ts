import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateContent } from "@/lib/moderation";

const schema = z.object({
  postId: z.string().min(1),
  body: z.string().min(1).max(10000),
  parentId: z.string().nullable().optional(),
  communityName: z.string().min(1),
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

    const { postId, body: commentBody, parentId, communityName } = parsed.data;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { community: true },
    });

    if (!post || post.community.name !== communityName) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // AI moderation for comments
    const moderation = await moderateContent({
      type: "comment",
      body: commentBody,
      communityName: post.community.name,
      communityDescription: post.community.description,
      communityRules: post.community.rules,
    });

    if (!moderation.allowed) {
      return NextResponse.json(
        {
          error: moderation.reason || "Comment rejected by moderator",
          moderated: true,
        },
        { status: 403 }
      );
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          body: commentBody,
          postId,
          authorId: session.user.id,
          parentId: parentId || null,
          moderationStatus: "approved",
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ id: comment.id });
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
