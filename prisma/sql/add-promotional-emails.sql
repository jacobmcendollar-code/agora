-- Additive only. Table is "users" (User @@map("users")).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promotionalEmails" BOOLEAN NOT NULL DEFAULT false;

