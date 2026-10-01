-- Additive only. Does not drop or rewrite existing rows.
--
-- Safe to run more than once, including while many app instances apply the
-- same changes at startup. Each block reads the catalog first. When the
-- object already exists, this script does not lock "users", "notifications",
-- or "reports". If two sessions create the same object together, these
-- races are treated as success:
--   duplicate_column   42701
--   duplicate_table    42P07
--   duplicate_object   42710
--   unique_violation   23505  (pg_type / pg_class catalog races)
--
-- Production (this database was previously managed with `prisma db push`):
--   psql "$DATABASE_URL" -f prisma/migrations/20261001180000_app_store_compliance/migration.sql
--
-- `npx prisma db push` also applies this schema change without dropping data.
-- Prefer the SQL file or db push over `prisma migrate dev`, which expects a
-- full migration history this repo does not have.

DO $$
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
END $$;

DO $$
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
END $$;

DO $$
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
END $$;

DO $$
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
END $$;

DO $$
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
END $$;

DO $$
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
END $$;

DO $$
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
END $$;

DO $$
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
END $$;

DO $$
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
END $$;
