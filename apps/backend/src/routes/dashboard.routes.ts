import { Router } from "express";
import { ok } from "@/lib/http.js";
import { requireAuth } from "@/middleware/auth.js";
import { getAnalytics, getDashboardSummary } from "@/services/orders/order.service.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    return ok(res, await getDashboardSummary());
  } catch (error) {
    next(error);
  }
});

dashboardRouter.get("/analytics", async (req, res, next) => {
  try {
    return ok(res, await getAnalytics(String(req.query.from ?? ""), String(req.query.to ?? "")));
  } catch (error) {
    next(error);
  }
});
