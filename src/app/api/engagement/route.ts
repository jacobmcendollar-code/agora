import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

const MAX_POSTS = 80;
const MAX_COMMENTS = 200;
const ID_RE = /^[a-z0-9_-]{1,64}$/i;

function parseIds(raw: string | null, max: number): string[] {
  if (!raw) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (!ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= max) break;
  }
  return ids;
}

const EMPTY = { votes: { posts: {}, comments: {} }, saved: {} };

export async function GET(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json(EMPTY, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const { searchParams } = new URL(req.url);
  const postIds = parseIds(searchParams.get("postIds"), MAX_POSTS);
  const commentIds = parseIds(searchParams.get("commentIds"), MAX_COMMENTS);

  if (postIds.length === 0 && commentIds.length === 0) {
    return NextResponse.json(EMPTY, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const [postVotes, commentVotes, savedRows] = await Promise.all([
    postIds.length
      ? prisma.postVote.findMany({
          where: { userId, postId: { in: postIds } },
          select: { postId: true, value: true },
        })
      : [],
    commentIds.length
      ? prisma.commentVote.findMany({
          where: { userId, commentId: { in: commentIds } },
          select: { commentId: true, value: true },
        })
      : [],
    postIds.length
      ? prisma.savedPost.findMany({
          where: { userId, postId: { in: postIds } },
          select: { postId: true },
        })
      : [],
  ]);

  const posts: Record<string, number> = {};
  for (const vote of postVotes) {
    if (vote.value === 1 || vote.value === -1) posts[vote.postId] = vote.value;
  }
  const comments: Record<string, number> = {};
  for (const vote of commentVotes) {
    if (vote.value === 1 || vote.value === -1) comments[vote.commentId] = vote.value;
  }
  const saved: Record<string, true> = {};
  for (const row of savedRows) saved[row.postId] = true;

  return NextResponse.json(
    { votes: { posts, comments }, saved },
    { headers: PRIVATE_NO_STORE_HEADERS }
  );
}
