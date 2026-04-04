import { Router } from "express";
import { loginRequestSchema } from "@order-hub/shared";
import { ok } from "@/lib/http.js";
import { authRateLimit } from "@/middleware/rate-limit.js";
import { login, refresh } from "@/services/auth/auth.service.js";

export const authRouter = Router();

authRouter.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const body = loginRequestSchema.parse(req.body);
    return ok(res, await login(body.email, body.password));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", authRateLimit, async (req, res, next) => {
  try {
    return ok(res, await refresh(String(req.body.refreshToken ?? "")));
  } catch (error) {
    next(error);
  }
});
