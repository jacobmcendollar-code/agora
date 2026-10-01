import { prisma } from "@/lib/prisma";

let ensured = false;
let inflight: Promise<void> | null = null;

const STATEMENTS = [
  'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)',
  'ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actorId" TEXT',
  'CREATE INDEX IF NOT EXISTS "notifications_actorId_idx" ON "notifications"("actorId")',
  `DO $$ BEGIN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    ALTER TABLE "reports"
      ADD CONSTRAINT "reports_reporterId_fkey"
      FOREIGN KEY ("reporterId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "reports_reporterId_targetType_targetId_key"
    ON "reports"("reporterId", "targetType", "targetId")`,
  'CREATE INDEX IF NOT EXISTS "reports_createdAt_idx" ON "reports"("createdAt")',
  `CREATE INDEX IF NOT EXISTS "reports_targetType_targetId_idx"
    ON "reports"("targetType", "targetId")`,
];

/** Idempotent additive schema for account deletion, block actors, and reports. */
export async function ensureComplianceSchema() {
  if (ensured) return;
  if (!inflight) {
    inflight = (async () => {
      for (const sql of STATEMENTS) {
        await prisma.$executeRawUnsafe(sql);
      }
      ensured = true;
    })().finally(() => {
      inflight = null;
    });
  }
  await inflight;
}
