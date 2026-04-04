import { Router } from "express";
import { z } from "zod";
import { ok } from "@/lib/http.js";
import { requireAuth, requireRole } from "@/middleware/auth.js";
import { getSettings, updateSettings } from "@/services/settings/settings.service.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/", async (_req, res, next) => {
  try {
    return ok(res, await getSettings());
  } catch (error) {
    next(error);
  }
});

settingsRouter.patch("/", requireRole(["admin", "manager"]), async (req, res, next) => {
  try {
    const body = z
      .object({
        store: z
          .object({
            name: z.string().optional(),
            timezone: z.string().optional(),
            address: z.string().optional(),
            phone: z.string().optional(),
            alertSoundEnabled: z.boolean().optional(),
            autoRefreshSeconds: z.number().optional()
          })
          .optional(),
        platformConnections: z
          .array(
            z.object({
              id: z.string().optional(),
              platform: z.enum(["uber_eats", "deliveroo", "just_eat"]),
              externalStoreId: z.string(),
              isEnabled: z.boolean(),
              usesEmailFallback: z.boolean().optional(),
              apiKey: z.string().optional(),
              apiSecret: z.string().optional(),
              webhookSecret: z.string().optional()
            })
          )
          .optional()
      })
      .parse(req.body);

    return ok(res, await updateSettings(body));
  } catch (error) {
    next(error);
  }
});
