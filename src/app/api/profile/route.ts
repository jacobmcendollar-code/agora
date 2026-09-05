import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

const schema = z.object({
  bio: z.string().max(500).optional().nullable(),
  image: z.string().url().optional().nullable().or(z.literal("")),
});

export async function PATCH(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const data: { bio?: string | null; image?: string | null } = {};

    if ("bio" in parsed.data) {
      const bio = parsed.data.bio?.trim() || null;
      data.bio = bio;
    }

    if ("image" in parsed.data) {
      data.image = parsed.data.image || null;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        bio: true,
        image: true,
      },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("[profile PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}