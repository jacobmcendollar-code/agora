import { ensureExpoPushTokenColumn } from "@/lib/ensure-expo-push-token-column";
import { prisma } from "@/lib/prisma";

export type NotificationInput = {
  type: string;
  message: string;
  link: string;
  userId: string;
};

function commentIdFromLink(link: string): string | null {
  const hash = (link.split("#")[1] || "").split("?")[0];
  return hash.match(/^comment-([^/?&#]+)$/i)?.[1] || null;
}

async function pushExpoNotification(row: {
  userId: string;
  type: string;
  message: string;
  link: string;
  createdAt: Date;
}) {
  try {
    await ensureExpoPushTokenColumn();
    const user = await prisma.user.findUnique({
      where: { id: row.userId },
      select: { expoPushToken: true },
    });
    const token = user?.expoPushToken;
    if (!token) return;

    const commentId = commentIdFromLink(row.link);
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title: "Agora",
        body: row.message,
        sound: "default",
        data: {
          link: row.link,
          type: row.type,
          message: row.message,
          createdAt: row.createdAt.toISOString(),
          ...(commentId ? { commentId } : {}),
        },
      }),
    });
    if (!res.ok) {
      console.error("[expo-push]", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[expo-push]", err);
  }
}

/** Persist an in-app notification, then Expo-push if the user has a token. Push failures never throw. */
export async function createNotification(data: NotificationInput) {
  const row = await prisma.notification.create({ data });
  await pushExpoNotification(row);
  return row;
}
