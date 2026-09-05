import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS, readMobileSession } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await readMobileSession(req);
  if (!session) {
    return NextResponse.json({ user: null }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      showNsfw: true,
    },
  });

  return NextResponse.json({ user: user ?? null }, { headers: PRIVATE_NO_STORE_HEADERS });
}
