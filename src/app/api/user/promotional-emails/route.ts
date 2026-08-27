import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensurePromotionalEmailsColumn } from "@/lib/ensure-promotional-emails-column";

const schema = z.object({
  promotionalEmails: z.boolean(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await ensurePromotionalEmailsColumn();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { promotionalEmails } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { promotionalEmails },
    });

    return NextResponse.json({ promotionalEmails });
  } catch (err) {
    console.error("[promotional-emails PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
