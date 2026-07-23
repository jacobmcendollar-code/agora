import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    if (
      comment.moderationStatus === "removed" ||
      comment.moderationStatus === "author_deleted"
    ) {
      return NextResponse.json({ error: "Already removed" }, { status: 400 });
    }

    const age = Date.now() - comment.createdAt.getTime();

    if (age <= ONE_HOUR_MS) {
      // Hard delete + decrement post comment count
      await prisma.$transaction([
        prisma.comment.delete({ where: { id } }),
        prisma.post.update({
          where: { id: comment.postId },
          data: { commentCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ mode: "hard" });
    }

    // Soft delete
    await prisma.comment.update({
      where: { id },
      data: { moderationStatus: "author_deleted" },
    });

    return NextResponse.json({ mode: "soft" });
  } catch (err) {
    console.error("[comments delete]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}