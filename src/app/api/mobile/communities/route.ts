import { NextResponse } from "next/server";
import { listCommunities } from "@/lib/communities";
import { readMobileSession } from "@/lib/mobile-session";

export async function GET(req: Request) {
  try {
    const session = await readMobileSession(req);
    return NextResponse.json(await listCommunities(session?.userId ?? null));
  } catch (err) {
    console.error("[mobile/communities GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
