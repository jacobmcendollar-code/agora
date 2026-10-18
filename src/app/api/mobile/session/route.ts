import { NextResponse } from "next/server";
import { loadAccountForSession } from "@/lib/active-user";
import { PRIVATE_NO_STORE_HEADERS, readMobileSession } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await readMobileSession(req);
  if (!session) {
    return NextResponse.json({ user: null }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const account = await loadAccountForSession(session.userId, session.sessionVersion);
  if (!account) {
    return NextResponse.json(
      { user: null },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
      showNsfw: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    return NextResponse.json(
      { user: null },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
        createdAt: user.createdAt,
        showNsfw: user.showNsfw,
      },
    },
    { headers: PRIVATE_NO_STORE_HEADERS }
  );
}
