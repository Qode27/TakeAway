import { config } from "dotenv";
import { z } from "zod";

config();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().default(""),
  REDIS_URL: z.string().default(""),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
  DEFAULT_TIMEZONE: z.string().default("Europe/Dublin"),
  STORE_NAME: z.string().default("Dublin Kebab House"),
  STORE_CURRENCY: z.string().default("EUR"),
  UBER_EATS_WEBHOOK_SECRET: z.string().default("dev-uber-secret"),
  TRUST_PROXY: z.string().default("1"),
  ENABLE_BACKGROUND_WORKERS: booleanFromEnv.default(true),
  ENABLE_EMAIL_POLLING: booleanFromEnv.default(false),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  WEBHOOK_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  WEBHOOK_RATE_LIMIT_MAX: z.coerce.number().default(120),
  EMAIL_FALLBACK_ENABLED: booleanFromEnv.default(true),
  EMAIL_HOST: z.string().default(""),
  EMAIL_PORT: z.coerce.number().default(993),
  EMAIL_USER: z.string().default(""),
  EMAIL_PASSWORD: z.string().default(""),
  EMAIL_TLS: booleanFromEnv.default(true),
  EMAIL_POLL_INTERVAL_MS: z.coerce.number().default(30000),
  SANITIZE_LOGS: booleanFromEnv.default(true),
  PRISMA_DISCONNECT_AFTER_RESPONSE: booleanFromEnv.default(false)
});

export const env = envSchema.parse(process.env);
