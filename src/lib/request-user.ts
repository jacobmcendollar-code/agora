import { loadAccountForSession, type ActiveAccount } from "@/lib/active-user";
import { auth } from "@/lib/auth";
import { readMobileSession } from "@/lib/mobile-session";

/** Website cookie session first; mobile Bearer / Cookie JWT as fallback. */
export async function accountFromRequest(req: Request): Promise<ActiveAccount | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      id: session.user.id,
      username: session.user.username,
      banned: Boolean(session.user.banned),
      sessionVersion: session.user.sessionVersion ?? 0,
    };
  }

  const mobile = await readMobileSession(req);
  if (!mobile) return null;
  return loadAccountForSession(mobile.userId, mobile.sessionVersion);
}

export async function userIdFromRequest(req: Request): Promise<string | null> {
  return (await accountFromRequest(req))?.id ?? null;
}
