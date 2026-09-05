import { prisma } from "./prisma";

export type CommunityJson = {
  id: string;
  name: string;
  title: string;
  description: string;
  nsfw: boolean;
  postFormat: string;
  createdAt: string;
  postCount: number;
  joined: boolean;
};

export async function listCommunities(userId?: string | null): Promise<CommunityJson[]> {
  const communities = await prisma.community.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      nsfw: true,
      postFormat: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });

  let joinedIds = new Set<string>();
  if (userId) {
    const subs = await prisma.subscription.findMany({
      where: { userId },
      select: { communityId: true },
    });
    joinedIds = new Set(subs.map((s) => s.communityId));
  }

  return communities.map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    description: c.description,
    nsfw: c.nsfw,
    postFormat: c.postFormat,
    createdAt: c.createdAt.toISOString(),
    postCount: c._count.posts,
    joined: joinedIds.has(c.id),
  }));
}
