-- Additive only. Does not drop or rewrite existing rows.
-- Existing sessions keep working: the column defaults to 0, which is the
-- version already implied by tokens issued before this column existed.
-- Password reset and account deletion increment it so older tokens stop.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'sessionVersion'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
  END IF;
EXCEPTION
  WHEN duplicate_column OR unique_violation THEN NULL;
END $$;
