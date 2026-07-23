import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    // Always return success to avoid account enumeration
    const successResponse = NextResponse.json({
      ok: true,
      message: "If that email exists, we sent a reset link.",
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, username: true },
    });

    if (!user?.email) {
      return successResponse;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Clean old tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const baseUrl =
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      "https://agor4.com";

    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    if (!process.env.RESEND_API_KEY) {
      console.error("[forgot-password] RESEND_API_KEY missing");
      return successResponse;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Agora <onboarding@resend.dev>",
      to: email,
      subject: "Reset your Agora password",
      html: `
        <p>Hi ${user.username},</p>
        <p>We received a request to reset your Agora password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn’t request this, you can ignore this email.</p>
      `,
    });

    return successResponse;
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}