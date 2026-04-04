import http from "node:http";
import { createApp } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";
import { createSocketServer } from "@/services/realtime/socket.js";
import { createIngestionWorker } from "@/services/queues/queue.js";
import { startEmailPolling } from "@/services/adapters/email/email-listener.service.js";
import { prisma } from "@/lib/prisma.js";
import { redis } from "@/lib/redis.js";

const app = createApp();
const server = http.createServer(app);
let emailPollingTimer: ReturnType<typeof setInterval> | undefined;

createSocketServer(server);
if (env.ENABLE_BACKGROUND_WORKERS) {
  createIngestionWorker(async (job: { id?: string; data?: unknown }) => {
    logger.info({ jobId: job.id, data: job.data }, "Processed background job");
  });
}
emailPollingTimer = startEmailPolling();

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Backend listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down backend");
  if (emailPollingTimer) clearInterval(emailPollingTimer);
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    await redis.quit().catch(() => undefined);
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
