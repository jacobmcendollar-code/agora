import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 1) {
    return NextResponse.json({ communities: [], posts: [] });
  }

  // Default: hide adult content unless the logged-in account has opted in
  let allowAdult = false;
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { showNsfw: true },
    });
    allowAdult = Boolean(user?.showNsfw);
  }

  const communityWhere = {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { title: { contains: q, mode: "insensitive" as const } },
    ],
    ...(allowAdult ? {} : { nsfw: false }),
  };

  const postWhere = {
    moderationStatus: "approved",
    title: { contains: q, mode: "insensitive" as const },
    ...(allowAdult ? {} : { community: { nsfw: false } }),
  };

  const [communities, posts] = await Promise.all([
    prisma.community.findMany({
      where: communityWhere,
      take: 6,
      orderBy: { title: "asc" },
      select: {
        name: true,
        title: true,
        nsfw: true,
      },
    }),
    prisma.post.findMany({
      where: postWhere,
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        community: { select: { name: true, title: true, nsfw: true } },
      },
    }),
  ]);

  return NextResponse.json({ communities, posts });
}