import { ensureComplianceSchema } from "@/lib/ensure-compliance-schema";
import { prisma } from "@/lib/prisma";

export type ActiveAccount = {
  id: string;
  username: string;
  banned: boolean;
  sessionVersion: number;
};

/**
 * Rejects deleted accounts and tokens issued before the latest password
 * reset. A database error fails closed so a lookup outage cannot keep a
 * revoked session alive.
 */
export async function loadAccountForSession(
  userId: string,
  sessionVersion: number | null | undefined
): Promise<ActiveAccount | null> {
  if (!userId) return null;

  try {
    await ensureComplianceSchema();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        banned: true,
        deletedAt: true,
        sessionVersion: true,
      },
    });
    if (!user || user.deletedAt) return null;

    const presented = typeof sessionVersion === "number" ? sessionVersion : 0;
    if (presented !== user.sessionVersion) return null;

    return {
      id: user.id,
      username: user.username,
      banned: user.banned,
      sessionVersion: user.sessionVersion,
    };
  } catch (err) {
    console.error("[active-user]", err);
    return null;
  }
}
