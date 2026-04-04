import { normalizedOrderSchema, type NormalizedOrder } from "@order-hub/shared";
import { NormalizeInput, PlatformAdapter } from "@/services/adapters/types.js";

type JustEatPayload = {
  id: string;
  vendorId: string;
  submittedAt: string;
  customer?: { fullName?: string; phone?: string; address?: string };
  fulfillment: { kind: "delivery" | "pickup"; notes?: string };
  basket: Array<{
    title: string;
    amount: number;
    quantity: number;
    options?: Array<{ label: string }>;
    note?: string;
  }>;
  pricing: {
    subtotal: number;
    tax: number;
    fees: { delivery: number; service: number };
    total: number;
  };
  paymentStatus: "paid" | "pending" | "failed";
};

export class JustEatAdapter implements PlatformAdapter {
  readonly platform = "just_eat" as const;

  async normalize(input: NormalizeInput): Promise<NormalizedOrder> {
    const payload = input.payload as JustEatPayload;
    return normalizedOrderSchema.parse({
      externalOrderId: payload.id,
      platform: this.platform,
      platformStoreId: payload.vendorId || input.platformStoreId,
      customerName: payload.customer?.fullName ?? null,
      customerPhone: payload.customer?.phone ?? null,
      fulfillmentType: payload.fulfillment.kind,
      deliveryAddress: payload.customer?.address ?? null,
      orderNotes: payload.fulfillment.notes ?? null,
      items: payload.basket.map((item) => ({
        name: item.title,
        quantity: item.quantity,
        unitPrice: item.amount,
        totalPrice: item.amount * item.quantity,
        notes: item.note ?? "",
        modifiers: item.options?.map((option) => option.label) ?? []
      })),
      subtotal: payload.pricing.subtotal,
      tax: payload.pricing.tax,
      deliveryFee: payload.pricing.fees.delivery,
      serviceFee: payload.pricing.fees.service,
      total: payload.pricing.total,
      paymentStatus: payload.paymentStatus,
      orderStatus: "new",
      kitchenStatus: "new",
      createdAt: payload.submittedAt,
      rawPayload: payload,
      ingestionSource: input.ingestionSource,
      syncState: input.ingestionSource === "email" ? "mocked" : "pending",
      errorState: null
    });
  }
}
