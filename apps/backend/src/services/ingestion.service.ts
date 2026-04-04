import crypto from "node:crypto";
import { Platform } from "@order-hub/shared";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@/lib/prisma.js";
import { AppError } from "@/lib/errors.js";
import { logger } from "@/lib/logger.js";
import { normalizeEmailOrder } from "@/services/adapters/email/email-fallback.adapter.js";
import { DeliverooAdapter } from "@/services/adapters/platforms/deliveroo.adapter.js";
import { JustEatAdapter } from "@/services/adapters/platforms/just-eat.adapter.js";
import { UberEatsAdapter } from "@/services/adapters/platforms/uber-eats.adapter.js";
import { persistNormalizedOrder } from "@/services/orders/order.service.js";

const adapters = {
  uber_eats: new UberEatsAdapter(),
  deliveroo: new DeliverooAdapter(),
  just_eat: new JustEatAdapter()
};

async function resolveStoreId(platform: Platform, platformStoreId: string) {
  const connection = await prisma.platformConnection.findFirst({
    where: { platform, externalStoreId: platformStoreId }
  });

  if (!connection) {
    const store = await prisma.store.findFirst();
    if (!store) {
      throw new AppError(StatusCodes.BAD_REQUEST, "STORE_NOT_CONFIGURED", "Store configuration is missing");
    }
    return store.id;
  }

  return connection.storeId;
}

export function verifyUberSignature(rawBody: string, signature: string | undefined, secret: string) {
  if (!signature) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "MISSING_SIGNATURE", "Webhook signature is missing");
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected !== signature) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "INVALID_SIGNATURE", "Webhook signature is invalid");
  }
}

export async function ingestWebhook(
  platform: "uber_eats" | "deliveroo" | "just_eat",
  payload: unknown,
  options: { signature?: string; rawBody: string; secret?: string }
) {
  if (platform === "uber_eats" && options.secret) {
    verifyUberSignature(options.rawBody, options.signature, options.secret);
  }

  const platformStoreId = String(
    (payload as { store_id?: string; restaurantId?: string; vendorId?: string }).store_id ??
      (payload as { restaurantId?: string }).restaurantId ??
      (payload as { vendorId?: string }).vendorId ??
      "default-store"
  );

  const adapter = adapters[platform];
  const normalized = await adapter.normalize({
    payload,
    platformStoreId,
    ingestionSource: "webhook"
  });

  const storeId = await resolveStoreId(platform, normalized.platformStoreId);
  const idempotencyKey = `${platform}:${normalized.platformStoreId}:${normalized.externalOrderId}`;
  return persistNormalizedOrder({
    order: normalized,
    storeId,
    idempotencyKey,
    signature: options.signature
  });
}

export async function ingestEmail(rawEmail: string) {
  try {
    const normalized = await normalizeEmailOrder(rawEmail);
    const storeId = await resolveStoreId(normalized.platform, normalized.platformStoreId);
    return await persistNormalizedOrder({
      order: normalized,
      storeId,
      idempotencyKey: `email:${normalized.platform}:${normalized.platformStoreId}:${normalized.externalOrderId}`,
      emailMeta: { subject: "email-fallback", from: "mailbox" }
    });
  } catch (error) {
    logger.error({ error }, "Email fallback normalization failed");
    await prisma.rawIngestionEvent
      .create({
        data: {
          platform: "email_fallback",
          source: "email",
          idempotencyKey: `email-failed:${crypto.createHash("sha256").update(rawEmail).digest("hex")}`,
          status: "failed",
          payload: { rawEmail },
          errorMessage: error instanceof Error ? error.message : "Unable to parse email order",
          processedAt: new Date()
        }
      })
      .catch(() => undefined);
    throw new AppError(StatusCodes.BAD_REQUEST, "EMAIL_PARSE_FAILED", "Unable to parse email order");
  }
}
