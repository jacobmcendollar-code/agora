import { NextResponse } from "next/server";
import { z } from "zod";
import { PRIVATE_NO_STORE_HEADERS, readMobileSession } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.union([z.string().min(8).max(512), z.null()]),
});

export async function POST(req: Request) {
  const session = await readMobileSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: PRIVATE_NO_STORE_HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { expoPushToken: parsed.data.token },
  });

  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
}
