import { NextResponse } from "next/server";
import { blockListsFor, relationWith } from "@/lib/blocks";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { username: normalized },
    select: {
      id: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const viewerId = await userIdFromRequest(req);
  const relation = viewerId
    ? await relationWith(viewerId, user.id)
    : { youBlocked: false, theyBlocked: false, hidden: false };
  const lists = viewerId ? await blockListsFor(viewerId) : null;
  const hidden = new Set(lists?.hiddenAuthorIds || []);

  const [posts, comments] = relation.hidden
    ? [[], []]
    : await Promise.all([
        prisma.post.findMany({
          where: {
            authorId: user.id,
            moderationStatus: "approved",
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            title: true,
            community: { select: { name: true, title: true } },
          },
        }),
        prisma.comment.findMany({
          where: { authorId: user.id, moderationStatus: "approved" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            body: true,
            imageUrl: true,
            createdAt: true,
            post: {
              select: {
                id: true,
                title: true,
                authorId: true,
                community: { select: { name: true, title: true } },
              },
            },
          },
        }),
      ]);

  const visibleComments = comments.filter((comment) => !hidden.has(comment.post.authorId));

  return NextResponse.json(
    {
      id: user.id,
      username: user.username,
      image: relation.hidden ? null : user.image,
      bio: relation.hidden ? null : user.bio,
      joined: user.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      createdAt: user.createdAt.toISOString(),
      blockedByYou: relation.youBlocked,
      contentHidden: relation.hidden,
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        communityName: post.community.name,
        communityTitle: post.community.title,
      })),
      comments: visibleComments.map((comment) => ({
        id: comment.id,
        body: comment.body || (comment.imageUrl ? "[image]" : ""),
        createdAt: comment.createdAt.toISOString(),
        postId: comment.post.id,
        postTitle: comment.post.title,
        communityName: comment.post.community.name,
        communityTitle: comment.post.community.title,
      })),
    },
    { headers: PRIVATE_NO_STORE_HEADERS }
  );
}
