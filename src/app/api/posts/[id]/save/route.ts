import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, moderationStatus: true },
    });

    if (!post || post.moderationStatus === "removed") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      await prisma.savedPost.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ saved: false });
    }

    await prisma.savedPost.create({
      data: {
        userId,
        postId,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (err) {
    console.error("[save POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ saved: false }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const { id: postId } = await params;

  try {
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return NextResponse.json(
      { saved: !!existing },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json({ saved: false }, { headers: PRIVATE_NO_STORE_HEADERS });
  }
}
