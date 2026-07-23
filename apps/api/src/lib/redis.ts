import Redis from "ioredis";
import { env } from "../config/env";

let redis: Redis | null = null;
let redisAvailable = false;

export function getRedis(): Redis | null {
  if (redis) return redis;
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    redis.on("ready", () => {
      redisAvailable = true;
    });
    redis.on("error", () => {
      redisAvailable = false;
    });
    redis.on("end", () => {
      redisAvailable = false;
    });
    return redis;
  } catch {
    redisAvailable = false;
    return null;
  }
}

export function isRedisAvailable() {
  return redisAvailable;
}

export async function connectRedis(): Promise<Redis | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    if (client.status === "wait") {
      await client.connect();
    }
    await client.ping();
    redisAvailable = true;
    return client;
  } catch {
    redisAvailable = false;
    return null;
  }
}

/** Best-effort distributed lock for expire worker. Returns true if lock acquired. */
export async function tryAcquireLock(
  key: string,
  ttlMs: number,
): Promise<boolean> {
  const client = getRedis();
  if (!client || !redisAvailable) return false;
  try {
    const result = await client.set(key, "1", "PX", ttlMs, "NX");
    return result === "OK";
  } catch {
    return false;
  }
}
