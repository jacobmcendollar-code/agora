import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();

let tableReady = false;

/**
 * Shared limiter. Postgres is the store that counts across Vercel instances.
 * If the table cannot be reached, the process falls back to memory.
 * That fallback is per isolate and disappears on a cold start, so it only
 * slows a hot loop on one instance. It is not a global limit.
 */
function memoryConsume(key: string, windowMs: number): Bucket {
  const now = Date.now();
  const current = memory.get(key);
  if (!current || current.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    memory.set(key, fresh);
    return fresh;
  }
  current.count += 1;
  return current;
}

function memoryPeek(key: string): Bucket | null {
  const current = memory.get(key);
  if (!current || current.resetAt <= Date.now()) return null;
  return current;
}

async function ensureTable() {
  if (tableReady || process.env.RATE_LIMIT_STORE === "memory") return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
      "key" TEXT NOT NULL,
      "count" INTEGER NOT NULL,
      "resetAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
    )
  `);
  tableReady = true;
}

function result(count: number, resetAtMs: number, limit: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));
  return { ok: count <= limit, retryAfter, count };
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  if (process.env.RATE_LIMIT_STORE === "memory") {
    const bucket = memoryConsume(key, windowMs);
    return result(bucket.count, bucket.resetAt, limit);
  }

  try {
    await ensureTable();
    const resetAt = new Date(Date.now() + windowMs);
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
      INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "rate_limit_buckets"."resetAt" <= NOW() THEN 1
          ELSE "rate_limit_buckets"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "rate_limit_buckets"."resetAt" <= NOW() THEN EXCLUDED."resetAt"
          ELSE "rate_limit_buckets"."resetAt"
        END
      RETURNING "count", "resetAt"
    `;
    const row = rows[0];
    const count = Number(row?.count ?? 1);
    const resetAtMs = row?.resetAt ? new Date(row.resetAt).getTime() : Date.now() + windowMs;
    return result(count, resetAtMs, limit);
  } catch (err) {
    console.error("[rate-limit] using in-memory fallback", err);
    const bucket = memoryConsume(key, windowMs);
    return result(bucket.count, bucket.resetAt, limit);
  }
}

export async function isRateLimited(key: string, limit: number) {
  if (process.env.RATE_LIMIT_STORE === "memory") {
    const bucket = memoryPeek(key);
    if (!bucket || bucket.count < limit) return { limited: false, retryAfter: 0 };
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000)),
    };
  }

  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
      SELECT "count", "resetAt"
      FROM "rate_limit_buckets"
      WHERE "key" = ${key}
    `;
    const row = rows[0];
    if (!row) return { limited: false, retryAfter: 0 };
    const resetAtMs = new Date(row.resetAt).getTime();
    if (resetAtMs <= Date.now() || Number(row.count) < limit) {
      return { limited: false, retryAfter: 0 };
    }
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error("[rate-limit] using in-memory fallback", err);
    const bucket = memoryPeek(key);
    if (!bucket || bucket.count < limit) return { limited: false, retryAfter: 0 };
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000)),
    };
  }
}

export function clientIp(headerList: Headers): string {
  const real = headerList.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  return "unknown";
}

export function tooManyRequests(retryAfter: number, message: string) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

export const LIMITS = {
  signupPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  loginPerIp: { limit: 30, windowMs: 15 * 60 * 1000 },
  loginFailuresPerUsername: { limit: 10, windowMs: 15 * 60 * 1000 },
  forgotPerIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  forgotPerEmail: { limit: 3, windowMs: 60 * 60 * 1000 },
  resetPerIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  postsPerUser: { limit: 12, windowMs: 10 * 60 * 1000 },
  commentsPerUser: { limit: 30, windowMs: 10 * 60 * 1000 },
  reportsPerUser: { limit: 8, windowMs: 60 * 60 * 1000 },
  reportsPerIp: { limit: 15, windowMs: 60 * 60 * 1000 },
} as const;
