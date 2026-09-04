import { NextResponse } from "next/server";

/** JWT sessions cannot be revoked server-side; the client clears its stored token. */
export async function POST() {
  return NextResponse.json({ ok: true });
}
