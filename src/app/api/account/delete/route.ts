import { NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/delete-account";
import { userIdFromRequest } from "@/lib/request-user";

export async function POST(req: Request) {
  const userId = await userIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await deleteUserAccount(userId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account delete]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
