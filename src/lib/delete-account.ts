import { prisma } from "@/lib/prisma";
import { ensureComplianceSchema } from "@/lib/ensure-compliance-schema";

export async function deleteUserAccount(userId: string) {
  await ensureComplianceSchema();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, deletedAt: true },
  });
  if (!user || user.deletedAt) {
    return { ok: false as const, status: 404, error: "Account not found" };
  }

  const deletedUsername = `deleted_${user.id}`;
  const deletedEmail = `deleted_${user.id}@deleted.agor4.invalid`;

  await prisma.$transaction(
    async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: userId },
        select: { deletedAt: true, username: true, email: true },
      });
      if (!current || current.deletedAt) return;

      await tx.post.updateMany({
        where: { authorId: userId },
        data: {
          moderationStatus: "author_deleted",
          title: "[deleted]",
          body: null,
          url: null,
          thumbnail: null,
        },
      });

      await tx.comment.updateMany({
        where: { authorId: userId },
        data: {
          moderationStatus: "author_deleted",
          body: "[deleted]",
          imageUrl: null,
        },
      });

      await tx.$executeRaw`
        UPDATE "posts" AS p
        SET "score" = p."score" - v."value"
        FROM "post_votes" AS v
        WHERE v."postId" = p."id" AND v."userId" = ${userId}
      `;
      await tx.$executeRaw`
        UPDATE "comments" AS c
        SET "score" = c."score" - v."value"
        FROM "comment_votes" AS v
        WHERE v."commentId" = c."id" AND v."userId" = ${userId}
      `;

      await tx.postVote.deleteMany({ where: { userId } });
      await tx.commentVote.deleteMany({ where: { userId } });
      await tx.savedPost.deleteMany({ where: { userId } });
      await tx.subscription.deleteMany({ where: { userId } });
      await tx.mute.deleteMany({
        where: { OR: [{ muterId: userId }, { mutedId: userId }] },
      });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({
        where: {
          OR: [
            { userId },
            { actorId: userId },
            { message: { startsWith: `${current.username} ` } },
          ],
        },
      });
      await tx.verificationToken.deleteMany({
        where: { identifier: current.email },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          username: deletedUsername,
          email: deletedEmail,
          emailVerified: null,
          passwordHash: null,
          image: null,
          bio: null,
          expoPushToken: null,
          showNsfw: false,
          promotionalEmails: false,
          deletedAt: new Date(),
        },
      });
    },
    { timeout: 60000 }
  );

  return { ok: true as const };
}
