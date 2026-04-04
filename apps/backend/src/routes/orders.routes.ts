import { Router } from "express";
import { z } from "zod";
import { ok } from "@/lib/http.js";
import { requireAuth } from "@/middleware/auth.js";
import { getOrder, listOrders, updateOrderStatus } from "@/services/orders/order.service.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get("/", async (req, res, next) => {
  try {
    return ok(res, await listOrders(req.query));
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    return ok(res, await getOrder(req.params.id));
  } catch (error) {
    next(error);
  }
});

ordersRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const body = z.object({ status: z.enum(["new", "accepted", "preparing", "ready", "completed", "cancelled"]) }).parse(req.body);
    return ok(res, await updateOrderStatus(req.params.id, body.status, req.user?.id));
  } catch (error) {
    next(error);
  }
});
