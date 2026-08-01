import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  showNsfw: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { showNsfw } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { showNsfw },
    });

    return NextResponse.json({ showNsfw });
  } catch (err) {
    console.error("[show-nsfw POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}