import { createNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

const MENTION_REGEX = /@([a-zA-Z0-9_]{2,30})/g;

export function extractMentions(text: string): string[] {
  const matches = text.matchAll(MENTION_REGEX);
  const usernames = new Set<string>();
  for (const match of matches) {
    usernames.add(match[1].toLowerCase());
  }
  return Array.from(usernames);
}

export async function notifyMentions({
  text,
  actorUsername,
  actorId,
  link,
}: {
  text: string;
  actorUsername: string;
  actorId: string;
  link: string;
}) {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({
    where: {
      username: { in: usernames },
      banned: false,
    },
    select: { id: true, username: true },
  });

  for (const user of users) {
    if (user.id === actorId) continue;

    // Do not notify across a block in either direction.
    const blocked = await prisma.mute.findFirst({
      where: {
        OR: [
          { muterId: user.id, mutedId: actorId },
          { muterId: actorId, mutedId: user.id },
        ],
      },
      select: { id: true },
    });
    if (blocked) continue;

    await createNotification({
      type: "mention",
      message: `${actorUsername} mentioned you`,
      link,
      userId: user.id,
      actorId,
    });
  }
}