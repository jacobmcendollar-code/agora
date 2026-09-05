import { NextResponse } from "next/server";
import { listCommunities } from "@/lib/communities";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/mobile-session";
import { userIdFromRequest } from "@/lib/request-user";

export async function GET(req: Request) {
  try {
    const userId = await userIdFromRequest(req);
    return NextResponse.json(await listCommunities(userId), {
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  } catch (err) {
    console.error("[mobile/communities GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
