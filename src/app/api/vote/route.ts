import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
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

    const { targetType, targetId, value } = parsed.data;
    const userId = session.user.id;

    if (targetType === "post") {
      const post = await prisma.post.findUnique({ where: { id: targetId } });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const existing = await prisma.postVote.findUnique({
        where: {
          userId_postId: { userId, postId: targetId },
        },
      });

      let scoreDelta = 0;

      if (value === 0) {
        // Remove vote
        if (existing) {
          scoreDelta = -existing.value;
          await prisma.postVote.delete({
            where: { id: existing.id },
          });
        }
      } else if (existing) {
        // Change vote
        scoreDelta = value - existing.value;
        await prisma.postVote.update({
          where: { id: existing.id },
          data: { value },
        });
      } else {
        // New vote
        scoreDelta = value;
        await prisma.postVote.create({
          data: { userId, postId: targetId, value },
        });
      }

      if (scoreDelta !== 0) {
        await prisma.post.update({
          where: { id: targetId },
          data: { score: { increment: scoreDelta } },
        });
      }

      const updated = await prisma.post.findUnique({
        where: { id: targetId },
        select: { score: true },
      });

      return NextResponse.json({ score: updated?.score ?? post.score });
    }

    // Comment vote
    const comment = await prisma.comment.findUnique({ where: { id: targetId } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const existing = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: { userId, commentId: targetId },
      },
    });

    let scoreDelta = 0;

    if (value === 0) {
      if (existing) {
        scoreDelta = -existing.value;
        await prisma.commentVote.delete({
          where: { id: existing.id },
        });
      }
    } else if (existing) {
      scoreDelta = value - existing.value;
      await prisma.commentVote.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      scoreDelta = value;
      await prisma.commentVote.create({
        data: { userId, commentId: targetId, value },
      });
    }

    if (scoreDelta !== 0) {
      await prisma.comment.update({
        where: { id: targetId },
        data: { score: { increment: scoreDelta } },
      });
    }

    const updated = await prisma.comment.findUnique({
      where: { id: targetId },
      select: { score: true },
    });

    return NextResponse.json({ score: updated?.score ?? comment.score });
  } catch (err) {
    console.error("[votes POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}