import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

const schema = z.object({
  postId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.username)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { postId } = parsed.data;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.update({
      where: { id: postId },
      data: { moderationStatus: "removed" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin remove post]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}