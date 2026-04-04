import pino from "pino";
import { env } from "@/config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" }
        },
  redact: env.SANITIZE_LOGS
    ? [
        "req.headers.authorization",
        "req.headers.cookie",
        "body.password",
        "body.refreshToken",
        "response.tokens",
        "email.password"
      ]
    : []
});
