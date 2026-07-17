import { env } from "@siaga-app/env/server";
import { Redis } from "@upstash/redis";

const WINDOW_SECONDS = 10 * 60;
const MAX_CALLS_PER_WINDOW = 3;
const localAttempts = new Map<string, { count: number; expiresAt: number }>();

let redis: Redis | null | undefined;

const getRedis = (): Redis | null => {
  if (redis !== undefined) {
    return redis;
  }
  redis =
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? new Redis({
          token: env.UPSTASH_REDIS_REST_TOKEN,
          url: env.UPSTASH_REDIS_REST_URL,
        })
      : null;
  return redis;
};

export const consumeOfflineCallStart = async (
  requestIpHash: string
): Promise<boolean> => {
  const redisClient = getRedis();
  if (redisClient) {
    const key = `siaga:offline-call:start:${requestIpHash}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, WINDOW_SECONDS);
    }
    return count <= MAX_CALLS_PER_WINDOW;
  }

  const now = Date.now();
  const current = localAttempts.get(requestIpHash);
  if (!current || current.expiresAt <= now) {
    localAttempts.set(requestIpHash, {
      count: 1,
      expiresAt: now + WINDOW_SECONDS * 1000,
    });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_CALLS_PER_WINDOW;
};
