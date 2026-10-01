import { prisma } from "@/lib/prisma";

let ensured = false;
let inflight: Promise<void> | null = null;

/**
 * Catalog races when many serverless instances migrate at once.
 * 42701 duplicate_column, 42P07 duplicate_table, 42710 duplicate_object,
 * 23505 unique_violation on pg_type / pg_class.
 */
const ALREADY_EXISTS = new Set(["42701", "42P07", "42710", "23505"]);

type Step = { flag: string; sql: string };

const STEPS: Step[] = [
  {
    flag: "user_deleted_at",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'deletedAt'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
EXCEPTION
  WHEN duplicate_column OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "notification_actor",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'actorId'
  ) THEN
    ALTER TABLE "notifications" ADD COLUMN "actorId" TEXT;
  END IF;
EXCEPTION
  WHEN duplicate_column OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "notification_actor_idx",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'notifications_actorId_idx'
      AND c.relkind = 'i'
  ) THEN
    CREATE INDEX "notifications_actorId_idx" ON "notifications"("actorId");
  END IF;
EXCEPTION
  WHEN duplicate_table OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "notification_actor_fk",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_namespace n ON n.oid = con.connamespace
    WHERE n.nspname = 'public'
      AND con.conname = 'notifications_actorId_fkey'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "reports_table",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'reports'
      AND c.relkind = 'r'
  ) THEN
    CREATE TABLE "reports" (
      "id" TEXT NOT NULL,
      "reporterId" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
    );
  END IF;
EXCEPTION
  WHEN duplicate_table OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "reports_fk",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_namespace n ON n.oid = con.connamespace
    WHERE n.nspname = 'public'
      AND con.conname = 'reports_reporterId_fkey'
  ) THEN
    ALTER TABLE "reports"
      ADD CONSTRAINT "reports_reporterId_fkey"
      FOREIGN KEY ("reporterId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION
  WHEN duplicate_object OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "reports_unique",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'reports_reporterId_targetType_targetId_key'
      AND c.relkind = 'i'
  ) THEN
    CREATE UNIQUE INDEX "reports_reporterId_targetType_targetId_key"
      ON "reports"("reporterId", "targetType", "targetId");
  END IF;
EXCEPTION
  WHEN duplicate_table OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "reports_created_idx",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'reports_createdAt_idx'
      AND c.relkind = 'i'
  ) THEN
    CREATE INDEX "reports_createdAt_idx" ON "reports"("createdAt");
  END IF;
EXCEPTION
  WHEN duplicate_table OR unique_violation THEN NULL;
END $$`,
  },
  {
    flag: "reports_target_idx",
    sql: `DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'reports_targetType_targetId_idx'
      AND c.relkind = 'i'
  ) THEN
    CREATE INDEX "reports_targetType_targetId_idx"
      ON "reports"("targetType", "targetId");
  END IF;
EXCEPTION
  WHEN duplicate_table OR unique_violation THEN NULL;
END $$`,
  },
];

const FLAG_SQL = `SELECT
  (EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'deletedAt'
  ))::int AS user_deleted_at,
  (EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'actorId'
  ))::int AS notification_actor,
  (EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'notifications_actorId_idx' AND c.relkind = 'i'
  ))::int AS notification_actor_idx,
  (EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_namespace n ON n.oid = con.connamespace
    WHERE n.nspname = 'public' AND con.conname = 'notifications_actorId_fkey'
  ))::int AS notification_actor_fk,
  (EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'reports' AND c.relkind = 'r'
  ))::int AS reports_table,
  (EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_namespace n ON n.oid = con.connamespace
    WHERE n.nspname = 'public' AND con.conname = 'reports_reporterId_fkey'
  ))::int AS reports_fk,
  (EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'reports_reporterId_targetType_targetId_key' AND c.relkind = 'i'
  ))::int AS reports_unique,
  (EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'reports_createdAt_idx' AND c.relkind = 'i'
  ))::int AS reports_created_idx,
  (EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'reports_targetType_targetId_idx' AND c.relkind = 'i'
  ))::int AS reports_target_idx`;

function isPresent(value: unknown): boolean {
  return value === true || value === 1 || value === BigInt(1);
}

function sqlState(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const meta = (err as { meta?: { code?: unknown } }).meta;
  if (typeof meta?.code === "string" && /^\d{5}$/.test(meta.code)) return meta.code;
  const message = (err as { message?: unknown }).message;
  if (typeof message !== "string") return undefined;
  return message.match(/Code:\s*`(\d{5})`/)?.[1];
}

async function readFlags(): Promise<Record<string, unknown> | undefined> {
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(FLAG_SQL);
  return rows[0];
}

function missingFlags(row: Record<string, unknown> | undefined): Step[] {
  return STEPS.filter((step) => !isPresent(row?.[step.flag]));
}

async function runIdempotent(sql: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (err) {
    const state = sqlState(err);
    if (state && ALREADY_EXISTS.has(state)) return;
    throw err;
  }
}

async function applyComplianceSchema() {
  const missing = missingFlags(await readFlags());
  if (missing.length === 0) {
    ensured = true;
    return;
  }

  for (const step of missing) {
    await runIdempotent(step.sql);
  }

  const stillMissing = missingFlags(await readFlags());
  if (stillMissing.length > 0) {
    throw new Error(
      `[ensure-compliance-schema] still missing: ${stillMissing.map((step) => step.flag).join(", ")}`
    );
  }
  ensured = true;
}

/**
 * Additive schema for account deletion, block actors, and reports.
 * Steady-state calls only read the catalog, so concurrent serverless
 * instances do not take AccessExclusiveLock on tables that are already migrated.
 * A failed attempt is not cached, so the next request retries.
 */
export async function ensureComplianceSchema() {
  if (ensured) return;
  if (!inflight) {
    inflight = applyComplianceSchema().finally(() => {
      inflight = null;
    });
  }
  await inflight;
}
