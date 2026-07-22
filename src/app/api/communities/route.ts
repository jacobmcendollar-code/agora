import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { title: "asc" },
      select: {
        name: true,
        title: true,
        description: true,
      },
    });

    return NextResponse.json(communities);
  } catch (err) {
    console.error("[communities GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}