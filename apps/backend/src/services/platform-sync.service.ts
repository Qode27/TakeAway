import { prisma } from "@/lib/prisma.js";
import { logger } from "@/lib/logger.js";

type StatusUpdateInput = {
  platform: "uber_eats" | "deliveroo" | "just_eat" | "email_fallback";
  orderId: string;
  externalOrderId: string;
  nextStatus: string;
};

export interface PlatformStatusSync {
  sendStatusUpdate(input: StatusUpdateInput): Promise<void>;
}

class MockPlatformStatusSync implements PlatformStatusSync {
  async sendStatusUpdate(input: StatusUpdateInput) {
    logger.info({ input }, "Mock platform status update");
    await prisma.webhookEvent.create({
      data: {
        rawIngestionEventId:
          (await prisma.order.findUnique({ where: { id: input.orderId }, select: { rawIngestionEventId: true } }))?.rawIngestionEventId ?? "",
        platform: input.platform === "email_fallback" ? "uber_eats" : input.platform,
        status: "mocked",
        responseCode: 202,
        responseBody: JSON.stringify({ nextStatus: input.nextStatus })
      }
    }).catch(() => undefined);
  }
}

export const platformStatusSync: PlatformStatusSync = new MockPlatformStatusSync();
