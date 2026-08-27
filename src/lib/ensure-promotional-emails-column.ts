import { prisma } from "@/lib/prisma";

let ensured = false;
let inflight: Promise<void> | null = null;

export async function ensurePromotionalEmailsColumn() {
  if (ensured) return;
  if (!inflight) {
    inflight = (async () => {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promotionalEmails" BOOLEAN NOT NULL DEFAULT false'
      );
      ensured = true;
    })().finally(() => {
      inflight = null;
    });
  }
  await inflight;
}
