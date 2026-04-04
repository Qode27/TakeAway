import express, { Router } from "express";
import { ok } from "@/lib/http.js";
import { webhookRateLimit } from "@/middleware/rate-limit.js";
import { env } from "@/config/env.js";
import { ingestEmail, ingestWebhook } from "@/services/ingestion.service.js";

export const webhooksRouter = Router();

webhooksRouter.post("/uber-eats", webhookRateLimit, async (req, res, next) => {
  try {
    return ok(
      res,
      await ingestWebhook("uber_eats", req.body, {
        rawBody: JSON.stringify(req.body),
        signature: req.headers["x-uber-signature"] as string | undefined,
        secret: env.UBER_EATS_WEBHOOK_SECRET
      })
    );
  } catch (error) {
    next(error);
  }
});

webhooksRouter.post("/deliveroo", webhookRateLimit, async (req, res, next) => {
  try {
    return ok(res, await ingestWebhook("deliveroo", req.body, { rawBody: JSON.stringify(req.body) }));
  } catch (error) {
    next(error);
  }
});

webhooksRouter.post("/just-eat", webhookRateLimit, async (req, res, next) => {
  try {
    return ok(res, await ingestWebhook("just_eat", req.body, { rawBody: JSON.stringify(req.body) }));
  } catch (error) {
    next(error);
  }
});

webhooksRouter.post("/email", express.text({ type: "*/*" }), async (req, res, next) => {
  try {
    return ok(res, await ingestEmail(String(req.body)));
  } catch (error) {
    next(error);
  }
});
