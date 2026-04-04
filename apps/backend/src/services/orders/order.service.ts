import crypto from "node:crypto";
import prismaClientPkg from "@prisma/client";
import type { OrderStatus, Prisma as PrismaNamespace } from "@prisma/client";
import { orderFiltersSchema, type NormalizedOrder } from "@order-hub/shared";
import dayjs from "dayjs";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@/lib/prisma.js";
import { AppError } from "@/lib/errors.js";
import { env } from "@/config/env.js";
import { logger } from "@/lib/logger.js";
import { ingestionQueue } from "@/services/queues/queue.js";
import { platformStatusSync } from "@/services/platform-sync.service.js";
import { emitOrderEvent } from "@/services/realtime/socket.js";
import { toOrderCard, decimalToNumber } from "@/services/orders/order.mapper.js";
import { writeAuditLog } from "@/services/audit.service.js";

const { Prisma } = prismaClientPkg;

function generateOrderNumber() {
  return `OH-${dayjs().format("YYMMDD")}-${crypto.randomInt(1000, 9999)}`;
}

export async function persistNormalizedOrder(input: {
  order: NormalizedOrder;
  storeId: string;
  idempotencyKey: string;
  signature?: string;
  emailMeta?: { subject?: string; from?: string };
}) {
  const getExistingOrder = () =>
    prisma.order.findUnique({
      where: {
        platform_externalOrderId_storeId: {
          platform: input.order.platform,
          externalOrderId: input.order.externalOrderId,
          storeId: input.storeId
        }
      },
      include: { items: true }
    });

  const existingIngestion = await prisma.rawIngestionEvent.findUnique({
    where: { idempotencyKey: input.idempotencyKey }
  });
  if (existingIngestion) {
    return getExistingOrder();
  }

  let rawEvent;
  try {
    rawEvent = await prisma.rawIngestionEvent.create({
      data: {
        platform: input.order.platform,
        source: input.order.ingestionSource,
        externalOrderId: input.order.externalOrderId,
        signature: input.signature,
        idempotencyKey: input.idempotencyKey,
        status: "received",
        payload: input.order.rawPayload as PrismaNamespace.JsonObject,
        normalizedPayload: input.order as unknown as PrismaNamespace.JsonObject,
        emailSubject: input.emailMeta?.subject,
        emailFrom: input.emailMeta?.from
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return getExistingOrder();
    }
    throw error;
  }

  const existingOrder = await getExistingOrder();

  if (existingOrder) {
    await prisma.rawIngestionEvent.update({
      where: { id: rawEvent.id },
      data: { status: "duplicate", processedAt: new Date() }
    });
    return existingOrder;
  }

  let order;
  try {
    order = await prisma.order.create({
      data: {
        internalOrderNumber: generateOrderNumber(),
        externalOrderId: input.order.externalOrderId,
        platform: input.order.platform,
        platformStoreId: input.order.platformStoreId,
        storeId: input.storeId,
        customerName: input.order.customerName,
        customerPhone: input.order.customerPhone,
        fulfillmentType: input.order.fulfillmentType,
        deliveryAddress: input.order.deliveryAddress,
        orderNotes: input.order.orderNotes,
        subtotal: input.order.subtotal,
        tax: input.order.tax,
        deliveryFee: input.order.deliveryFee,
        serviceFee: input.order.serviceFee,
        total: input.order.total,
        paymentStatus: input.order.paymentStatus,
        orderStatus: input.order.orderStatus,
        kitchenStatus: input.order.kitchenStatus,
        scheduledFor: input.order.scheduledFor ? new Date(input.order.scheduledFor) : null,
        ingestionSource: input.order.ingestionSource,
        syncState: input.order.syncState,
        errorState: input.order.errorState,
        rawPayload: input.order.rawPayload as PrismaNamespace.JsonObject,
        rawIngestionEventId: rawEvent.id,
        createdAt: new Date(input.order.createdAt),
        items: {
          create: input.order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes,
            modifiers: item.modifiers
          }))
        },
        events: {
          create: {
            type: "ingested",
            toStatus: input.order.orderStatus,
            payload: { source: input.order.ingestionSource }
          }
        }
      },
      include: { items: true }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await prisma.rawIngestionEvent.update({
        where: { id: rawEvent.id },
        data: { status: "duplicate", processedAt: new Date() }
      });
      return getExistingOrder();
    }

    await prisma.rawIngestionEvent.update({
      where: { id: rawEvent.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Order persistence failed",
        processedAt: new Date()
      }
    });
    throw error;
  }

  await prisma.rawIngestionEvent.update({
    where: {
      id: rawEvent.id
    },
    data: { status: "processed", processedAt: new Date() }
  });

  emitOrderEvent("orders:new", toOrderCard(order));
  if (env.ENABLE_BACKGROUND_WORKERS) {
    await ingestionQueue.add("notify-new-order", { orderId: order.id }, { attempts: 3, backoff: { type: "exponential", delay: 1000 } });
  }
  return order;
}

export async function listOrders(filters: unknown) {
  const parsed = orderFiltersSchema.parse(filters);
  const orders = await prisma.order.findMany({
    where: {
      platform: parsed.platform,
      orderStatus: parsed.status,
      fulfillmentType: parsed.fulfillmentType,
      ...(parsed.search
        ? {
            OR: [
              { internalOrderNumber: { contains: parsed.search, mode: "insensitive" } },
              { customerName: { contains: parsed.search, mode: "insensitive" } },
              { externalOrderId: { contains: parsed.search, mode: "insensitive" } }
            ]
          }
        : {}),
      createdAt:
        parsed.from || parsed.to
          ? {
              gte: parsed.from ? new Date(parsed.from) : undefined,
              lte: parsed.to ? new Date(parsed.to) : undefined
            }
          : undefined
    },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  return orders.map(toOrderCard);
}

export async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "desc" } }, rawIngestionEvent: true }
  });

  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found");
  }

  return {
    ...toOrderCard(order),
    deliveryAddress: order.deliveryAddress,
    customerPhone: order.customerPhone,
    subtotal: decimalToNumber(order.subtotal),
    tax: decimalToNumber(order.tax),
    deliveryFee: decimalToNumber(order.deliveryFee),
    serviceFee: decimalToNumber(order.serviceFee),
    paymentStatus: order.paymentStatus,
    syncState: order.syncState,
    events: order.events.map((event) => ({
      id: event.id,
      type: event.type,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      createdAt: event.createdAt.toISOString()
    })),
    rawIngestionEvent: order.rawIngestionEvent
      ? {
          id: order.rawIngestionEvent.id,
          source: order.rawIngestionEvent.source,
          status: order.rawIngestionEvent.status,
          errorMessage: order.rawIngestionEvent.errorMessage
        }
      : null
  };
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

export async function updateOrderStatus(id: string, nextStatus: OrderStatus, userId?: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND", "Order was not found");
  }

  if (!allowedTransitions[order.orderStatus].includes(nextStatus)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "INVALID_TRANSITION", "That status transition is not allowed");
  }

  const kitchenStatus =
    nextStatus === "accepted" || nextStatus === "preparing"
      ? "preparing"
      : nextStatus === "ready"
        ? "ready"
        : nextStatus === "completed"
          ? "completed"
          : "new";

  const updated = await prisma.order.update({
    where: { id },
    data: {
      orderStatus: nextStatus,
      kitchenStatus,
      events: {
        create: {
          type: "status_changed",
          fromStatus: order.orderStatus,
          toStatus: nextStatus,
          payload: { userId }
        }
      }
    },
    include: { items: true }
  });

  emitOrderEvent("orders:updated", toOrderCard(updated));
  if (updated.platform === "uber_eats") {
    try {
      await platformStatusSync.sendStatusUpdate({
        platform: updated.platform,
        orderId: updated.id,
        externalOrderId: updated.externalOrderId,
        nextStatus
      });
    } catch (error) {
      logger.error({ error, orderId: updated.id }, "Platform status sync failed");
    }
  }
  await writeAuditLog({
    userId,
    action: "order.status_changed",
    entityType: "Order",
    entityId: id,
    metadata: { from: order.orderStatus, to: nextStatus }
  });
  return toOrderCard(updated);
}

export async function getDashboardSummary() {
  const today = dayjs().startOf("day").toDate();
  const orders = await prisma.order.findMany({ where: { createdAt: { gte: today } } });
  const platformMap = new Map<string, { count: number; revenue: number }>();

  for (const order of orders) {
    const existing = platformMap.get(order.platform) ?? { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += decimalToNumber(order.total);
    platformMap.set(order.platform, existing);
  }

  return {
    totalOrders: orders.length,
    newOrders: orders.filter((order) => order.orderStatus === "new").length,
    preparingOrders: orders.filter((order) => ["accepted", "preparing"].includes(order.orderStatus)).length,
    readyOrders: orders.filter((order) => order.orderStatus === "ready").length,
    revenueToday: orders.reduce((sum, order) => sum + decimalToNumber(order.total), 0),
    platformBreakdown: [...platformMap.entries()].map(([platform, metrics]) => ({
      platform: platform as "uber_eats" | "deliveroo" | "just_eat" | "email_fallback",
      count: metrics.count,
      revenue: metrics.revenue
    }))
  };
}

export async function getAnalytics(from?: string, to?: string) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined
      }
    }
  });

  const revenueByPlatform = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.platform] = (acc[order.platform] ?? 0) + decimalToNumber(order.total);
    return acc;
  }, {});

  const countsByPlatform = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.platform] = (acc[order.platform] ?? 0) + 1;
    return acc;
  }, {});

  const countsByStatus = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] ?? 0) + 1;
    return acc;
  }, {});

  return {
    revenueByPlatform,
    countsByPlatform,
    countsByStatus,
    averagePreparationMinutes: 14,
    totalOrders: orders.length
  };
}
