import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn().mockResolvedValue({ id: "order-1", items: [] })
}));

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    rawIngestionEvent: {
      findUnique: vi.fn().mockResolvedValue({ id: "evt-1" }),
      create: vi.fn(),
      update: vi.fn()
    },
    order: {
      findFirst: vi.fn(),
      findUnique: mocks.findUnique,
      create: vi.fn()
    }
  }
}));

vi.mock("@/services/queues/queue.js", () => ({
  ingestionQueue: {
    add: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock("@/services/realtime/socket.js", () => ({
  emitOrderEvent: vi.fn()
}));

import { persistNormalizedOrder } from "@/services/orders/order.service.js";

describe("idempotency", () => {
  it("returns the existing order when ingestion key already exists", async () => {
    const result = await persistNormalizedOrder({
      order: {
        externalOrderId: "1",
        platform: "uber_eats",
        platformStoreId: "uber-dublin-01",
        customerName: null,
        customerPhone: null,
        fulfillmentType: "delivery",
        deliveryAddress: null,
        orderNotes: null,
        items: [{ name: "Burger", quantity: 1, unitPrice: 10, totalPrice: 10, notes: "", modifiers: [] }],
        subtotal: 10,
        tax: 1,
        deliveryFee: 0,
        serviceFee: 0,
        total: 11,
        paymentStatus: "paid",
        orderStatus: "new",
        kitchenStatus: "new",
        createdAt: new Date().toISOString(),
        rawPayload: {},
        ingestionSource: "webhook",
        syncState: "pending",
        errorState: null
      },
      storeId: "seed-store",
      idempotencyKey: "dup-key"
    });

    expect(mocks.findUnique).toHaveBeenCalled();
    expect(result?.id).toBe("order-1");
  });
});
