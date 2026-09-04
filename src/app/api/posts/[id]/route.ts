import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().max(40000).optional().nullable(),
});

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true } },
        community: {
          select: { id: true, name: true, title: true, postFormat: true, nsfw: true },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!post || post.moderationStatus === "removed") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let mutedIds: string[] = [];
    if (session?.user?.id) {
      const mutes = await prisma.mute.findMany({
        where: { muterId: session.user.id },
        select: { mutedId: true },
      });
      mutedIds = mutes.map((m) => m.mutedId);
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId: post.id,
        moderationStatus: { in: ["approved", "author_deleted"] },
        ...(mutedIds.length ? { authorId: { notIn: mutedIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, username: true } },
      },
    });

    const isSoftDeleted = post.moderationStatus === "author_deleted";

    return NextResponse.json({
      post: {
        ...post,
        author: {
          id: post.author.id,
          username: isSoftDeleted ? "[deleted]" : post.author.username,
        },
      },
      comments: comments.map((c) => ({
        ...c,
        author: {
          id: c.author.id,
          username:
            c.moderationStatus === "author_deleted"
              ? "[deleted]"
              : c.author.username,
        },
      })),
    });
  } catch (err) {
    console.error("[posts GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const age = Date.now() - post.createdAt.getTime();
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

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: parsed.data.title ?? post.title,
        body:
          parsed.data.body !== undefined ? parsed.data.body : post.body,
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      body: updated.body,
    });
  } catch (err) {
    console.error("[posts PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}