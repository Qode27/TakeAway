import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import fs from "node:fs";
import pinoHttp from "pino-http";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";
import { prisma } from "@/lib/prisma.js";
import { errorHandler } from "@/middleware/error-handler.js";
import { authRouter } from "@/routes/auth.routes.js";
import { dashboardRouter } from "@/routes/dashboard.routes.js";
import { healthRouter } from "@/routes/health.routes.js";
import { ordersRouter } from "@/routes/orders.routes.js";
import { settingsRouter } from "@/routes/settings.routes.js";
import { webhooksRouter } from "@/routes/webhooks.routes.js";

export function createApp() {
  const app = express();
  const httpLogger = ((pinoHttp as any).default ?? pinoHttp) as any;
  const allowedOrigins = env.APP_ORIGIN.split(",").map((origin) => origin.trim());
  const runtimeDir = path.dirname(process.argv[1] ?? process.cwd());
  const frontendDistCandidates = [
    path.resolve(runtimeDir, "../../frontend/dist"),
    path.resolve(process.cwd(), "../frontend/dist"),
    path.resolve(process.cwd(), "apps/frontend/dist"),
    path.resolve(process.cwd(), "frontend/dist")
  ];
  const frontendDistPath =
    frontendDistCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) ??
    frontendDistCandidates[0];
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(helmet());
  app.use(
    cors((req, callback) => {
      const origin = req.headers.origin;
      const host = req.headers["x-forwarded-host"] ?? req.headers.host;
      // The frontend is served by this same server, so same-origin requests are always allowed
      const isSameOrigin = Boolean(origin && host && new URL(origin).host === host);
      if (!origin || isSameOrigin || allowedOrigins.includes(origin)) {
        callback(null, { origin: true, credentials: true });
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(httpLogger({ logger }));
  if (env.PRISMA_DISCONNECT_AFTER_RESPONSE) {
    app.use((_req, res, next) => {
      const releaseConnections = () => {
        void prisma.$disconnect().catch((error: unknown) => {
          logger.warn({ error }, "Failed to release Prisma connections after response");
        });
      };
      res.on("finish", releaseConnections);
      res.on("close", releaseConnections);
      next();
    });
  }

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/webhooks", webhooksRouter);
  app.use("/api/ingest", webhooksRouter);

  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
      if (error) next(error);
    });
  });

  app.use(errorHandler);

  return app;
}
