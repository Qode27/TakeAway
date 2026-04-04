import { Decimal } from "@prisma/client/runtime/library";
import type { Order, OrderItem } from "@prisma/client";
import { OrderCard } from "@order-hub/shared";

export function toOrderCard(order: Order & { items: OrderItem[] }): OrderCard {
  return {
    id: order.id,
    internalOrderNumber: order.internalOrderNumber,
    externalOrderId: order.externalOrderId,
    platform: order.platform,
    customerName: order.customerName,
    fulfillmentType: order.fulfillmentType,
    total: decimalToNumber(order.total),
    orderStatus: order.orderStatus,
    kitchenStatus: order.kitchenStatus,
    createdAt: order.createdAt.toISOString(),
    orderNotes: order.orderNotes,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      notes: item.notes ?? "",
      modifiers: Array.isArray(item.modifiers) ? (item.modifiers as string[]) : []
    }))
  };
}

export const decimalToNumber = (value: Decimal) => Number(value.toString());
