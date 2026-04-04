import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeEmailOrder } from "@/services/adapters/email/email-fallback.adapter.js";

describe("email fallback parser", () => {
  it("parses Deliveroo email orders", async () => {
    const raw = readFileSync(new URL("../../fixtures/deliveroo-email.eml", import.meta.url), "utf8");
    const result = await normalizeEmailOrder(raw);
    expect(result.platform).toBe("deliveroo");
    expect(result.items[0]?.name).toContain("Pizza");
  });

  it("parses Just Eat email orders", async () => {
    const raw = readFileSync(new URL("../../fixtures/just-eat-email.eml", import.meta.url), "utf8");
    const result = await normalizeEmailOrder(raw);
    expect(result.platform).toBe("just_eat");
    expect(result.customerName).toBe("Orla Brennan");
  });
});
