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

    await prisma.notification.create({
      data: {
        type: "mention",
        message: `${actorUsername} mentioned you`,
        link,
        userId: user.id,
      },
    });
  }
}