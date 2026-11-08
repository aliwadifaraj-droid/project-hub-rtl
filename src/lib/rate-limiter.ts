// Simple in-memory rate limiter for auth endpoints.
// Tracks attempts by key (e.g. IP+email) with a sliding window.
// Server-only. Do not import from client code.

import { getRequest } from "@tanstack/react-start/server";

type Bucket = {
  attempts: number[];
  blockedUntil: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function pruneOldEntries() {
  if (buckets.size <= MAX_BUCKETS) return;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.blockedUntil < now && v.attempts.length === 0) {
      buckets.delete(k);
    }
  }
}

export function getClientIp(): string {
  const req = getRequest();
  if (!req) return "unknown";
  const forwarded = req.headers?.get?.("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers?.get?.("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Check if a key is rate-limited.
 * Returns { allowed, retryAfterMs }.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  lockoutMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (bucket && bucket.blockedUntil > now) {
    return { allowed: false, retryAfterMs: bucket.blockedUntil - now };
  }

  if (!bucket) {
    bucket = { attempts: [], blockedUntil: 0 };
    buckets.set(key, bucket);
  }

  bucket.attempts = bucket.attempts.filter((t) => now - t < windowMs);

  return { allowed: bucket.attempts.length < maxAttempts, retryAfterMs: 0 };
}

/**
 * Record a failed attempt for a key.
 * If the threshold is reached within the window, block the key for lockoutMs.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number,
  windowMs: number,
  lockoutMs: number,
): void {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { attempts: [], blockedUntil: 0 };
    buckets.set(key, bucket);
  }

  bucket.attempts = bucket.attempts.filter((t) => now - t < windowMs);
  bucket.attempts.push(now);

  if (bucket.attempts.length >= maxAttempts) {
    bucket.blockedUntil = now + lockoutMs;
    bucket.attempts = [];
  }

  pruneOldEntries();
}

/** Reset attempts for a key (call on successful login). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Format milliseconds as a human-readable Arabic string. */
export function formatRetryMs(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes >= 1) return `حاول مرة أخرى بعد ${minutes} دقيقة`;
  const seconds = Math.ceil(ms / 1000);
  return `حاول مرة أخرى بعد ${seconds} ثانية`;
}
