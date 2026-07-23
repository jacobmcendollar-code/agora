import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  body: z.string().min(1).max(10000),
});

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function PATCH(
  req: Request,
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

    const age = Date.now() - comment.createdAt.getTime();
    if (age > ONE_HOUR_MS) {
      return NextResponse.json(
        { error: "Edit window has expired (1 hour)" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { body: parsed.data.body },
    });

    return NextResponse.json({
      id: updated.id,
      body: updated.body,
    });
  } catch (err) {
    console.error("[comments PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}