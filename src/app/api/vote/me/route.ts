import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

export async function GET(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ value: 0 }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json({ value: 0 }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (targetType === "post") {
    const vote = await prisma.postVote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: targetId,
        },
      },
    });
    return NextResponse.json(
      { value: vote?.value ?? 0 },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  if (targetType === "comment") {
    const vote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId: targetId,
        },
      },
    });
    return NextResponse.json(
      { value: vote?.value ?? 0 },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  return NextResponse.json({ value: 0 }, { headers: PRIVATE_NO_STORE_HEADERS });
}
