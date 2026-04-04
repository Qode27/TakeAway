import { normalizedOrderSchema, type NormalizedOrder } from "@order-hub/shared";
import { NormalizeInput, PlatformAdapter } from "@/services/adapters/types.js";

type DeliverooPayload = {
  orderReference: string;
  restaurantId: string;
  placedAt: string;
  customerName?: string;
  customerPhone?: string;
  serviceType: "delivery" | "pickup";
  deliveryAddress?: string;
  notes?: string;
  lines: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    modifiers?: string[];
    notes?: string;
  }>;
  pricing: {
    subtotal: number;
    vat: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
  };
  paymentStatus: "paid" | "pending" | "failed";
};

export class DeliverooAdapter implements PlatformAdapter {
  readonly platform = "deliveroo" as const;

  async normalize(input: NormalizeInput): Promise<NormalizedOrder> {
    const payload = input.payload as DeliverooPayload;
    return normalizedOrderSchema.parse({
      externalOrderId: payload.orderReference,
      platform: this.platform,
      platformStoreId: payload.restaurantId || input.platformStoreId,
      customerName: payload.customerName ?? null,
      customerPhone: payload.customerPhone ?? null,
      fulfillmentType: payload.serviceType,
      deliveryAddress: payload.deliveryAddress ?? null,
      orderNotes: payload.notes ?? null,
      items: payload.lines.map((line) => ({
        name: line.name,
        quantity: line.qty,
        unitPrice: line.unitPrice,
        totalPrice: line.unitPrice * line.qty,
        notes: line.notes ?? "",
        modifiers: line.modifiers ?? []
      })),
      subtotal: payload.pricing.subtotal,
      tax: payload.pricing.vat,
      deliveryFee: payload.pricing.deliveryFee,
      serviceFee: payload.pricing.serviceFee,
      total: payload.pricing.total,
      paymentStatus: payload.paymentStatus,
      orderStatus: "new",
      kitchenStatus: "new",
      createdAt: payload.placedAt,
      rawPayload: payload,
      ingestionSource: input.ingestionSource,
      syncState: input.ingestionSource === "email" ? "mocked" : "pending",
      errorState: null
    });
  }
}
