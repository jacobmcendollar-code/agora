-- Additive only. One row per limiter key, updated in place.
-- Does not drop or rewrite existing tables.

CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
