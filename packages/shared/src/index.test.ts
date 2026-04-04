import { describe, expect, it } from "vitest";
import { normalizedOrderSchema } from "./index";

describe("shared contracts", () => {
  it("validates a normalized order", () => {
    const result = normalizedOrderSchema.safeParse({
      externalOrderId: "ext-1",
      platform: "uber_eats",
      platformStoreId: "uber-dublin-01",
      customerName: "Sarah Byrne",
      customerPhone: null,
      fulfillmentType: "delivery",
      deliveryAddress: "22 Rathmines Road Lower, Dublin 6",
      orderNotes: null,
      items: [{ name: "Doner Kebab Meal", quantity: 1, unitPrice: 10, totalPrice: 10, notes: "", modifiers: [] }],
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
    });

    expect(result.success).toBe(true);
  });
});
