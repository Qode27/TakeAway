import { Platform } from "@prisma/client";
import uberPayload from "../fixtures/uber-order.json" with { type: "json" };
import deliverooPayload from "../fixtures/deliveroo-order.json" with { type: "json" };
import justEatPayload from "../fixtures/just-eat-order.json" with { type: "json" };
import { env } from "@/config/env.js";
import { hashPassword } from "@/lib/hash.js";
import { prisma } from "@/lib/prisma.js";
import { DeliverooAdapter } from "@/services/adapters/platforms/deliveroo.adapter.js";
import { JustEatAdapter } from "@/services/adapters/platforms/just-eat.adapter.js";
import { UberEatsAdapter } from "@/services/adapters/platforms/uber-eats.adapter.js";
import { persistNormalizedOrder } from "@/services/orders/order.service.js";

async function main() {
  const passwordHash = await hashPassword("Password123!");

  const store = await prisma.store.upsert({
    where: { id: "seed-store" },
    update: {},
    create: {
      id: "seed-store",
      name: env.STORE_NAME,
      timezone: env.DEFAULT_TIMEZONE,
      currency: env.STORE_CURRENCY,
      address: "12 Camden Street Lower, Dublin 2",
      phone: "+353 1 555 0101"
    }
  });

  await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@orderhub.ie" },
      update: {},
      create: { email: "admin@orderhub.ie", passwordHash, fullName: "Aisling Murphy", role: "admin" }
    }),
    prisma.user.upsert({
      where: { email: "manager@orderhub.ie" },
      update: {},
      create: { email: "manager@orderhub.ie", passwordHash, fullName: "Conor Doyle", role: "manager" }
    }),
    prisma.user.upsert({
      where: { email: "kitchen@orderhub.ie" },
      update: {},
      create: { email: "kitchen@orderhub.ie", passwordHash, fullName: "Niamh Kelly", role: "kitchen_staff" }
    })
  ]);

  await Promise.all(
    [
      { platform: Platform.uber_eats, externalStoreId: "uber-dublin-01", isEnabled: true },
      { platform: Platform.deliveroo, externalStoreId: "deliveroo-dublin-01", isEnabled: true, usesEmailFallback: true },
      { platform: Platform.just_eat, externalStoreId: "justeat-dublin-01", isEnabled: true, usesEmailFallback: true }
    ].map((connection) =>
      prisma.platformConnection.upsert({
        where: { platform_externalStoreId: { platform: connection.platform, externalStoreId: connection.externalStoreId } },
        update: connection,
        create: { ...connection, storeId: store.id }
      })
    )
  );

  const normalizedOrders = await Promise.all([
    new UberEatsAdapter().normalize({ payload: uberPayload, platformStoreId: "uber-dublin-01", ingestionSource: "seed" }),
    new DeliverooAdapter().normalize({ payload: deliverooPayload, platformStoreId: "deliveroo-dublin-01", ingestionSource: "seed" }),
    new JustEatAdapter().normalize({ payload: justEatPayload, platformStoreId: "justeat-dublin-01", ingestionSource: "seed" })
  ]);

  await Promise.all(
    normalizedOrders.map((order) =>
      persistNormalizedOrder({
        order,
        storeId: store.id,
        idempotencyKey: `seed:${order.platform}:${order.externalOrderId}`
      })
    )
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
