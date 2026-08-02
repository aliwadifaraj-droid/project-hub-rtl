/**
 * Upstash Redis cache helper (server-side only usage).
 * Safe by design: if Upstash env vars are missing or Redis errors,
 * every helper degrades to a direct call with no caching.
 */

type RedisLike = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown>;
  del: (...keys: string[]) => Promise<unknown>;
};

let clientPromise: Promise<RedisLike | null> | null = null;

async function getRedis(): Promise<RedisLike | null> {
  if (typeof window !== "undefined") return null;
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const url = process.env["UPSTASH_REDIS_REST_URL"];
    const token = process.env["UPSTASH_REDIS_REST_TOKEN"];
    if (!url || !token) return null;
    try {
      const { Redis } = await import("@upstash/redis");
      return new Redis({ url, token }) as unknown as RedisLike;
    } catch (e) {
      console.error("[cache] failed to init Upstash Redis:", e);
      return null;
    }
  })();
  return clientPromise;
}

// ---- Key builders ----
export const cacheKeys = {
  chat: (customerId: string) => `chat_${customerId}`,
  projectsAll: () => `projects_all`,
  quotes: (clientId: string) => `quotes_${clientId}`,
};

export const TTL_CHAT = 600; // 10 minutes
export const TTL_PROJECTS = 300; // 5 minutes

/** Read-through cache. Falls back to `loader()` on any cache failure. */
export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const redis = await getRedis();
  if (!redis) return loader();
  try {
    const hit = await redis.get(key);
    if (hit !== null && hit !== undefined) {
      return (typeof hit === "string" ? JSON.parse(hit) : hit) as T;
    }
  } catch (e) {
    console.error("[cache] get failed", key, e);
  }
  const fresh = await loader();
  try {
    await redis.set(key, JSON.stringify(fresh), { ex: ttlSeconds });
  } catch (e) {
    console.error("[cache] set failed", key, e);
  }
  return fresh;
}

/** Delete one or more keys; never throws. */
export async function invalidate(...keys: Array<string | null | undefined>): Promise<void> {
  const list = keys.filter((k): k is string => !!k);
  if (list.length === 0) return;
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.del(...list);
  } catch (e) {
    console.error("[cache] del failed", list, e);
  }
}

export const invalidateProjectsAll = () => invalidate(cacheKeys.projectsAll());
export const invalidateQuotes = (clientId: string | null | undefined) =>
  invalidate(clientId ? cacheKeys.quotes(clientId) : null);
export const invalidateChat = (customerId: string) => invalidate(cacheKeys.chat(customerId));
