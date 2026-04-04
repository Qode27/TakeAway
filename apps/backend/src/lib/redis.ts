import IORedis from "ioredis";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";

const RedisClient = ((IORedis as any).default ?? IORedis) as any;

type RedisLike = {
  ping: () => Promise<string>;
  quit: () => Promise<string>;
  on: (_event: string, _listener: (error: Error) => void) => RedisLike;
};

function createNoopRedis(): RedisLike {
  return {
    ping: async () => "PONG",
    quit: async () => "OK",
    on: () => createNoopRedis()
  };
}

export const redis: RedisLike = env.ENABLE_BACKGROUND_WORKERS
  ? new RedisClient(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true
    })
  : createNoopRedis();

redis.on("error", (error: Error) => {
  logger.warn({ error: error.message }, "Redis connection warning");
});
