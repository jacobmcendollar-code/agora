import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

const suggest = unstable_cache(
  async (q: string, allowAdult: boolean) => {
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

    return { communities, posts };
  },
  ["search-suggest-v1"],
  { revalidate: 60 }
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 1) {
    return NextResponse.json(
      { communities: [], posts: [] },
      { headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  // Same URL is SFW or NSFW depending on the account, so this stays private.
  let allowAdult = false;
  const userId = await userIdFromRequest(req);
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { showNsfw: true },
    });
    allowAdult = Boolean(user?.showNsfw);
  }

  const results = await suggest(q, allowAdult);

  return NextResponse.json(results, { headers: PRIVATE_NO_STORE_HEADERS });
}
