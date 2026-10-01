import { auth } from "@/lib/auth";
import { ensureComplianceSchema } from "@/lib/ensure-compliance-schema";
import { readMobileSession } from "@/lib/mobile-session";
import { prisma } from "@/lib/prisma";

/** Website cookie session first; mobile Bearer / Cookie JWT as fallback. */
export async function userIdFromRequest(req: Request): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id || (await readMobileSession(req))?.userId || null;
  if (!userId) return null;

  try {
    await ensureComplianceSchema();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { deletedAt: true },
    });
    if (!user || user.deletedAt) return null;
  } catch (err) {
    console.error("[request-user]", err);
  }

  return userId;
}
