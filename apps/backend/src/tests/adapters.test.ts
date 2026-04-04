import deliverooPayload from "../../fixtures/deliveroo-order.json" with { type: "json" };
import justEatPayload from "../../fixtures/just-eat-order.json" with { type: "json" };
import uberPayload from "../../fixtures/uber-order.json" with { type: "json" };
import { describe, expect, it } from "vitest";
import { DeliverooAdapter } from "@/services/adapters/platforms/deliveroo.adapter.js";
import { JustEatAdapter } from "@/services/adapters/platforms/just-eat.adapter.js";
import { UberEatsAdapter } from "@/services/adapters/platforms/uber-eats.adapter.js";

describe("platform adapters", () => {
  it("normalizes Uber Eats orders", async () => {
    const result = await new UberEatsAdapter().normalize({
      payload: uberPayload,
      platformStoreId: "uber-dublin-01",
      ingestionSource: "webhook"
    });
    expect(result.platform).toBe("uber_eats");
    expect(result.total).toBe(31.55);
  });

  it("normalizes Deliveroo orders", async () => {
    const result = await new DeliverooAdapter().normalize({
      payload: deliverooPayload,
      platformStoreId: "deliveroo-dublin-01",
      ingestionSource: "webhook"
    });
    expect(result.fulfillmentType).toBe("pickup");
  });

  it("normalizes Just Eat orders", async () => {
    const result = await new JustEatAdapter().normalize({
      payload: justEatPayload,
      platformStoreId: "justeat-dublin-01",
      ingestionSource: "webhook"
    });
    expect(result.customerName).toBe("Emma Walsh");
  });
});
