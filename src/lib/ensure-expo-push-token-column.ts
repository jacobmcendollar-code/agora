import { prisma } from "@/lib/prisma";

let ensured = false;
let inflight: Promise<void> | null = null;

export async function ensureExpoPushTokenColumn() {
  if (ensured) return;
  if (!inflight) {
    inflight = (async () => {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "expoPushToken" TEXT'
      );
      ensured = true;
    })().finally(() => {
      inflight = null;
    });
  }
  await inflight;
}
