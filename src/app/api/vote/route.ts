import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
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
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { targetType, targetId, value } = parsed.data;
    const userId = session.user.id;

    if (targetType === "post") {
      const existing = await prisma.postVote.findUnique({
        where: { userId_postId: { userId, postId: targetId } },
      });

      let scoreDelta = 0;
      let userVote: number | null = value;

      if (!existing) {
        // New vote
        await prisma.postVote.create({
          data: { userId, postId: targetId, value },
        });
        scoreDelta = value;
      } else if (existing.value === value) {
        // Toggle off
        await prisma.postVote.delete({
          where: { userId_postId: { userId, postId: targetId } },
        });
        scoreDelta = -value;
        userVote = null;
      } else {
        // Switch direction
        await prisma.postVote.update({
          where: { userId_postId: { userId, postId: targetId } },
          data: { value },
        });
        scoreDelta = value * 2; // e.g. from -1 to +1 = +2
      }

      const updated = await prisma.post.update({
        where: { id: targetId },
        data: { score: { increment: scoreDelta } },
        select: { score: true },
      });

      return NextResponse.json({ score: updated.score, userVote });
    } else {
      // Comment vote
      const existing = await prisma.commentVote.findUnique({
        where: { userId_commentId: { userId, commentId: targetId } },
      });

      let scoreDelta = 0;
      let userVote: number | null = value;

      if (!existing) {
        await prisma.commentVote.create({
          data: { userId, commentId: targetId, value },
        });
        scoreDelta = value;
      } else if (existing.value === value) {
        await prisma.commentVote.delete({
          where: { userId_commentId: { userId, commentId: targetId } },
        });
        scoreDelta = -value;
        userVote = null;
      } else {
        await prisma.commentVote.update({
          where: { userId_commentId: { userId, commentId: targetId } },
          data: { value },
        });
        scoreDelta = value * 2;
      }

      const updated = await prisma.comment.update({
        where: { id: targetId },
        data: { score: { increment: scoreDelta } },
        select: { score: true },
      });

      return NextResponse.json({ score: updated.score, userVote });
    }
  } catch (err) {
    console.error("[vote]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
