import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";
import { moderateContent } from "@/lib/moderation";
import { notifyMentions } from "@/lib/mentions";

const MEDIA_PER_HOUR = 20;

const schema = z.object({
  postId: z.string().min(1),
  body: z.string().max(10000).optional().nullable(),
  parentId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

async function isMutedBy(muterId: string, mutedId: string) {
  const mute = await prisma.mute.findUnique({
    where: {
      muterId_mutedId: {
        muterId,
        mutedId,
      },
    },
    select: { id: true },
  });
  return !!mute;
}

async function countRecentMediaComments(userId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  return prisma.comment.count({
    where: {
      authorId: userId,
      imageUrl: { not: null },
      createdAt: { gte: since },
    },
  });
}

export async function POST(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true, username: true },
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

    const { postId, body: rawBody, parentId, imageUrl } = parsed.data;
    const commentBody = (rawBody || "").trim();

    if (!commentBody && !imageUrl) {
      return NextResponse.json(
        { error: "Comment must have text or an image" },
        { status: 400 }
      );
    }

    if (imageUrl) {
      const mediaCount = await countRecentMediaComments(userId);
      if (mediaCount >= MEDIA_PER_HOUR) {
        return NextResponse.json(
          {
            error:
              "Too many images or GIFs this hour. You can still post text comments.",
          },
          { status: 429 }
        );
      }
    }

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

    if (commentBody) {
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
    }

    const comment = await prisma.comment.create({
      data: {
        body: commentBody,
        imageUrl: imageUrl || null,
        postId,
        authorId: userId,
        parentId: parentId || null,
        moderationStatus: "approved",
        score: 1,
      },
    });

    await prisma.commentVote.create({
      data: {
        value: 1,
        userId,
        commentId: comment.id,
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    const link = `/c/${post.community.name}/posts/${post.id}#comments`;
    const actorUsername = dbUser?.username || "Someone";

    if (post.authorId !== userId) {
      const muted = await isMutedBy(post.authorId, userId);
      if (!muted) {
        await prisma.notification.create({
          data: {
            type: "comment_on_post",
            message: `${actorUsername} commented on your post “${post.title}”`,
            link,
            userId: post.authorId,
          },
        });
      }
    }

    if (parentComment && parentComment.authorId !== userId) {
      const muted = await isMutedBy(parentComment.authorId, userId);
      if (!muted) {
        await prisma.notification.create({
          data: {
            type: "reply_to_comment",
            message: `${actorUsername} replied to your comment`,
            link,
            userId: parentComment.authorId,
          },
        });
      }
    }

    if (commentBody) {
      await notifyMentions({
        text: commentBody,
        actorUsername,
        actorId: userId,
        link,
      });
    }

    return NextResponse.json({ id: comment.id });
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}