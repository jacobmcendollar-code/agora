import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";
import { userIdFromRequest } from "@/lib/request-user";

export async function GET(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return NextResponse.json(
    { notifications, unreadCount },
    { headers: PRIVATE_NO_STORE_HEADERS }
  );
}

export async function PATCH(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
