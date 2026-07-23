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
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    if (post.moderationStatus === "removed" || post.moderationStatus === "author_deleted") {
      return NextResponse.json({ error: "Already removed" }, { status: 400 });
    }

    const age = Date.now() - post.createdAt.getTime();

    if (age <= ONE_HOUR_MS) {
      // Hard delete
      await prisma.post.delete({ where: { id } });
      return NextResponse.json({ mode: "hard" });
    }

    // Soft delete
    await prisma.post.update({
      where: { id },
      data: { moderationStatus: "author_deleted" },
    });

    return NextResponse.json({ mode: "soft" });
  } catch (err) {
    console.error("[posts delete]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}