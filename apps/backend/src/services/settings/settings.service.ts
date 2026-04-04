import { prisma } from "@/lib/prisma.js";

export async function getSettings() {
  return prisma.store.findFirst({
    include: {
      platformConnections: true,
      emailInboxConfigs: true,
      printerConfigs: true
    }
  });
}

export async function updateSettings(payload: {
  store?: {
    name?: string;
    timezone?: string;
    address?: string;
    phone?: string;
    alertSoundEnabled?: boolean;
    autoRefreshSeconds?: number;
  };
  platformConnections?: Array<{
    id?: string;
    platform: "uber_eats" | "deliveroo" | "just_eat";
    externalStoreId: string;
    isEnabled: boolean;
    usesEmailFallback?: boolean;
    apiKey?: string;
    apiSecret?: string;
    webhookSecret?: string;
  }>;
}) {
  const existingStore = await prisma.store.findFirstOrThrow();

  if (payload.store) {
    await prisma.store.update({
      where: { id: existingStore.id },
      data: payload.store
    });
  }

  if (payload.platformConnections) {
    await Promise.all(
      payload.platformConnections.map((connection) =>
        prisma.platformConnection.upsert({
          where: connection.id
            ? { id: connection.id }
            : {
                platform_externalStoreId: {
                  platform: connection.platform,
                  externalStoreId: connection.externalStoreId
                }
              },
          update: {
            externalStoreId: connection.externalStoreId,
            isEnabled: connection.isEnabled,
            usesEmailFallback: connection.usesEmailFallback ?? false,
            apiKey: connection.apiKey,
            apiSecret: connection.apiSecret,
            webhookSecret: connection.webhookSecret
          },
          create: {
            storeId: existingStore.id,
            platform: connection.platform,
            externalStoreId: connection.externalStoreId,
            isEnabled: connection.isEnabled,
            usesEmailFallback: connection.usesEmailFallback ?? false,
            apiKey: connection.apiKey,
            apiSecret: connection.apiSecret,
            webhookSecret: connection.webhookSecret
          }
        })
      )
    );
  }

  return getSettings();
}
