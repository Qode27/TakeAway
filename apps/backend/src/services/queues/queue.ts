import { env } from "@/config/env.js";
import { JobsOptions, Processor, Queue, Worker } from "bullmq";
import { logger } from "@/lib/logger.js";
import { redis } from "@/lib/redis.js";

type QueueLike = {
  add: (name: string, data: unknown, options?: JobsOptions) => Promise<unknown>;
};

export const ingestionQueue: QueueLike = env.ENABLE_BACKGROUND_WORKERS
  ? new Queue("ingestion", {
      connection: redis as never
    })
  : {
      add: async () => undefined
    };

export function createIngestionWorker(processor: Processor) {
  if (!env.ENABLE_BACKGROUND_WORKERS) {
    return null;
  }
  return new Worker("ingestion", processor, {
    connection: redis as never
  }).on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Ingestion job failed");
  });
}
