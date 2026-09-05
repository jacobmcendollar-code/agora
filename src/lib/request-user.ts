import { auth } from "@/lib/auth";
import { readMobileSession } from "@/lib/mobile-session";

/** Website cookie session first; mobile Bearer / Cookie JWT as fallback. */
export async function userIdFromRequest(req: Request): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  return (await readMobileSession(req))?.userId ?? null;
}
