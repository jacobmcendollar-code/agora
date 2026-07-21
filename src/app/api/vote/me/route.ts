import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ value: 0 });
  }

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json({ value: 0 });
  }

  if (targetType === "post") {
    const vote = await prisma.postVote.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: targetId,
        },
      },
    });
    return NextResponse.json({ value: vote?.value ?? 0 });
  }

  if (targetType === "comment") {
    const vote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: targetId,
        },
      },
    });
    return NextResponse.json({ value: vote?.value ?? 0 });
  }

  return NextResponse.json({ value: 0 });
}