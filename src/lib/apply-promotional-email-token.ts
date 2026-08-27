import { prisma } from "@/lib/prisma";
import { verifyPromotionalEmailToken } from "@/lib/promotional-email-token";

export async function applyPromotionalEmailToken(
  token: string | undefined,
  value: boolean
): Promise<"ok" | "invalid"> {
  if (!token) return "invalid";

  let payload: { userId: string; exp: number } | null = null;
  try {
    payload = verifyPromotionalEmailToken(token);
  } catch {
    return "invalid";
  }
  if (!payload) return "invalid";

  try {
    const result = await prisma.user.updateMany({
      where: { id: payload.userId },
      data: { promotionalEmails: value },
    });
    if (result.count === 0) return "invalid";
    return "ok";
  } catch {
    return "invalid";
  }
}

