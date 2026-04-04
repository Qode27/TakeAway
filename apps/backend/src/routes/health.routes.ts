import { Router } from "express";
import { env } from "@/config/env.js";
import { ok } from "@/lib/http.js";
import { prisma } from "@/lib/prisma.js";
import { redis } from "@/lib/redis.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => ok(res, { status: "ok", uptime: process.uptime() }));

healthRouter.get("/ready", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (env.ENABLE_BACKGROUND_WORKERS) {
      await redis.ping();
    }
    return ok(res, { status: "ready" });
  } catch (error) {
    next(error);
  }
});
