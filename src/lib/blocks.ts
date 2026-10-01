import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export { BLOCK_CONFIRM, UNBLOCK_CONFIRM } from "@/lib/block-copy";

export type BlockLists = {
  blockedByViewer: string[];
  blockedViewer: string[];
  hiddenAuthorIds: string[];
};

const emptyLists: BlockLists = {
  blockedByViewer: [],
  blockedViewer: [],
  hiddenAuthorIds: [],
};

/** Users whose posts and comments the viewer should not see, in either direction. */
export async function blockListsFor(viewerId: string | null | undefined): Promise<BlockLists> {
  if (!viewerId) return emptyLists;

  const [outgoing, incoming] = await Promise.all([
    prisma.mute.findMany({
      where: { muterId: viewerId },
      select: { mutedId: true },
    }),
    prisma.mute.findMany({
      where: { mutedId: viewerId },
      select: { muterId: true },
    }),
  ]);

  const blockedByViewer = outgoing.map((row) => row.mutedId);
  const blockedViewer = incoming.map((row) => row.muterId);
  return {
    blockedByViewer,
    blockedViewer,
    hiddenAuthorIds: [...new Set([...blockedByViewer, ...blockedViewer])],
  };
}

export async function relationWith(viewerId: string, otherId: string) {
  if (!viewerId || !otherId || viewerId === otherId) {
    return { youBlocked: false, theyBlocked: false, hidden: false };
  }
  const rows = await prisma.mute.findMany({
    where: {
      OR: [
        { muterId: viewerId, mutedId: otherId },
        { muterId: otherId, mutedId: viewerId },
      ],
    },
    select: { muterId: true, mutedId: true },
  });
  const youBlocked = rows.some((row) => row.muterId === viewerId && row.mutedId === otherId);
  const theyBlocked = rows.some((row) => row.muterId === otherId && row.mutedId === viewerId);
  return { youBlocked, theyBlocked, hidden: youBlocked || theyBlocked };
}

export function authorNotIn(hiddenAuthorIds: string[]): Prisma.PostWhereInput {
  if (hiddenAuthorIds.length === 0) return {};
  return { authorId: { notIn: hiddenAuthorIds } };
}

type ThreadComment = {
  id: string;
  parentId: string | null;
  authorId: string;
};

/**
 * Drop comments by hidden authors and every reply under those comments.
 * Replies are removed rather than promoted to the top level.
 */
export function commentsVisibleToViewer<T extends ThreadComment>(
  comments: T[],
  hiddenAuthorIds: Iterable<string>
): T[] {
  const hiddenAuthors = new Set(hiddenAuthorIds);
  if (hiddenAuthors.size === 0) return comments;

  const hiddenComments = new Set<string>();
  for (const comment of comments) {
    if (hiddenAuthors.has(comment.authorId)) hiddenComments.add(comment.id);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const comment of comments) {
      if (hiddenComments.has(comment.id) || !comment.parentId) continue;
      if (hiddenComments.has(comment.parentId)) {
        hiddenComments.add(comment.id);
        changed = true;
      }
    }
  }

  return comments.filter((comment) => !hiddenComments.has(comment.id));
}

/** Remove notifications either person caused for the other, including rows from before actorId existed. */
export async function clearBlockNotifications(blockerId: string, blockedId: string) {
  const users = await prisma.user.findMany({
    where: { id: { in: [blockerId, blockedId] } },
    select: { id: true, username: true },
  });
  const blocker = users.find((user) => user.id === blockerId);
  const blocked = users.find((user) => user.id === blockedId);

  const ors: Prisma.NotificationWhereInput[] = [
    { userId: blockerId, actorId: blockedId },
    { userId: blockedId, actorId: blockerId },
  ];
  if (blocked?.username) {
    ors.push({
      userId: blockerId,
      actorId: null,
      message: { startsWith: `${blocked.username} ` },
    });
  }
  if (blocker?.username) {
    ors.push({
      userId: blockedId,
      actorId: null,
      message: { startsWith: `${blocker.username} ` },
    });
  }

  await prisma.notification.deleteMany({ where: { OR: ors } });
}
