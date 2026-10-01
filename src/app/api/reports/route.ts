import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ensureComplianceSchema } from "@/lib/ensure-compliance-schema";
import { prisma } from "@/lib/prisma";
import { isReportReason, isReportTargetType } from "@/lib/reports";
import { userIdFromRequest } from "@/lib/request-user";
import { EMAIL_INBOX, sendEmail } from "@/lib/send-email";

const schema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  reason: z.string().min(1),
  note: z.string().max(2000).optional().nullable(),
});

async function targetSummary(targetType: string, targetId: string) {
  if (targetType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        title: true,
        authorId: true,
        community: { select: { name: true } },
      },
    });
    if (!post) return null;
    return {
      authorId: post.authorId,
      link: `https://www.agor4.com/c/${post.community.name}/posts/${post.id}`,
      label: post.title,
    };
  }

  if (targetType === "comment") {
    const comment = await prisma.comment.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        authorId: true,
        post: { select: { id: true, community: { select: { name: true } } } },
      },
    });
    if (!comment) return null;
    return {
      authorId: comment.authorId,
      link: `https://www.agor4.com/c/${comment.post.community.name}/posts/${comment.post.id}#comment-${comment.id}`,
      label: `Comment ${comment.id}`,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, username: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return null;
  return {
    authorId: user.id,
    link: `https://www.agor4.com/u/${user.username}`,
    label: `@${user.username}`,
  };
}

export async function POST(req: Request) {
  const reporterId = await userIdFromRequest(req);
  if (!reporterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureComplianceSchema();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { targetType, targetId, reason } = parsed.data;
    const note = (parsed.data.note || "").trim() || null;

    if (!isReportTargetType(targetType) || !isReportReason(reason)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const target = await targetSummary(targetType, targetId);
    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (target.authorId === reporterId) {
      return NextResponse.json(
        { error: "You can't report your own content." },
        { status: 400 }
      );
    }

    const reporter = await prisma.user.findUnique({
      where: { id: reporterId },
      select: { username: true },
    });

    try {
      await prisma.report.create({
        data: {
          reporterId,
          targetType,
          targetId,
          reason,
          note,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json(
          { error: "You already reported this." },
          { status: 409 }
        );
      }
      throw err;
    }

    // Stored for review only. Reports never change moderationStatus or hide content.
    const email = await sendEmail({
      to: EMAIL_INBOX,
      subject: `[Agora report] ${reason}`,
      text: [
        `Reason: ${reason}`,
        `Target: ${targetType} ${targetId}`,
        `Label: ${target.label}`,
        `Link: ${target.link}`,
        `Reporter: @${reporter?.username || reporterId}`,
        note ? `Note: ${note}` : "Note: (none)",
      ].join("\n"),
    });
    if (!email.ok) {
      console.error("[reports] email was not sent:", email.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reports POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
