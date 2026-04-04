import { normalizedOrderSchema, type NormalizedOrder } from "@order-hub/shared";
import { PlatformAdapter, NormalizeInput } from "@/services/adapters/types.js";

type UberPayload = {
  order_id: string;
  store_id: string;
  created_at: string;
  customer?: { name?: string; phone?: string };
  type: "DELIVERY" | "PICKUP";
  address?: { formatted?: string };
  note?: string;
  totals: { subtotal: number; tax: number; delivery_fee: number; service_fee: number; total: number };
  payment: { status: "PAID" | "PENDING" | "FAILED" };
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    special_instructions?: string;
    modifiers?: Array<{ title: string }>;
  }>;
};

export class UberEatsAdapter implements PlatformAdapter {
  readonly platform = "uber_eats" as const;

  async normalize(input: NormalizeInput): Promise<NormalizedOrder> {
    const payload = input.payload as UberPayload;
    return normalizedOrderSchema.parse({
      externalOrderId: payload.order_id,
      platform: this.platform,
      platformStoreId: payload.store_id || input.platformStoreId,
      customerName: payload.customer?.name ?? null,
      customerPhone: payload.customer?.phone ?? null,
      fulfillmentType: payload.type === "DELIVERY" ? "delivery" : "pickup",
      deliveryAddress: payload.address?.formatted ?? null,
      orderNotes: payload.note ?? null,
      items: payload.items.map((item) => ({
        name: item.title,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        notes: item.special_instructions ?? "",
        modifiers: item.modifiers?.map((modifier) => modifier.title) ?? []
      })),
      subtotal: payload.totals.subtotal,
      tax: payload.totals.tax,
      deliveryFee: payload.totals.delivery_fee,
      serviceFee: payload.totals.service_fee,
      total: payload.totals.total,
      paymentStatus:
        payload.payment.status === "PAID"
          ? "paid"
          : payload.payment.status === "FAILED"
            ? "failed"
            : "pending",
      orderStatus: "new",
      kitchenStatus: "new",
      createdAt: payload.created_at,
      rawPayload: payload,
      ingestionSource: input.ingestionSource,
      syncState: "pending",
      errorState: null
    });
  }
}
