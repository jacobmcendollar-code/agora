import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateContent } from "@/lib/moderation";

const schema = z.object({
  postId: z.string().min(1),
  body: z.string().min(1).max(10000),
  parentId: z.string().optional().nullable(),
});

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
      { error: "Your account is restricted from commenting." },
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

    const { postId, body: commentBody, parentId } = parsed.data;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        community: {
          select: { name: true, title: true, description: true, rules: true },
        },
        author: { select: { id: true, username: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { author: { select: { id: true, username: true } } },
      });
      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const moderation = await moderateContent({
      type: "comment",
      title: "",
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

    const comment = await prisma.comment.create({
      data: {
        body: commentBody,
        postId,
        authorId: session.user.id,
        parentId: parentId || null,
        moderationStatus: "approved",
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    const link = `/c/${post.community.name}/posts/${post.id}#comments`;
    const actorUsername = session.user.username || "Someone";

    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "comment_on_post",
          message: `${actorUsername} commented on your post “${post.title}”`,
          link,
          userId: post.authorId,
        },
      });
    }

    if (parentComment && parentComment.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "reply_to_comment",
          message: `${actorUsername} replied to your comment`,
          link,
          userId: parentComment.authorId,
        },
      });
    }

    return NextResponse.json({ id: comment.id });
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}