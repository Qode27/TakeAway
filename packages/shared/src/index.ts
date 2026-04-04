import { z } from "zod";

export const platformSchema = z.enum(["uber_eats", "deliveroo", "just_eat", "email_fallback"]);
export type Platform = z.infer<typeof platformSchema>;

export const ingestionSourceSchema = z.enum(["webhook", "email", "manual", "seed"]);
export type IngestionSource = z.infer<typeof ingestionSourceSchema>;

export const fulfillmentTypeSchema = z.enum(["delivery", "pickup"]);
export type FulfillmentType = z.infer<typeof fulfillmentTypeSchema>;

export const paymentStatusSchema = z.enum(["pending", "paid", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const orderStatusSchema = z.enum(["new", "accepted", "preparing", "ready", "completed", "cancelled"]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const kitchenStatusSchema = z.enum(["new", "preparing", "ready", "completed"]);
export type KitchenStatus = z.infer<typeof kitchenStatusSchema>;

export const syncStateSchema = z.enum(["pending", "synced", "failed", "mocked"]);
export type SyncState = z.infer<typeof syncStateSchema>;

export const roleSchema = z.enum(["admin", "manager", "kitchen_staff"]);
export type Role = z.infer<typeof roleSchema>;

export const moneySchema = z.number().nonnegative();

export const normalizedOrderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: moneySchema,
  totalPrice: moneySchema,
  notes: z.string().optional().default(""),
  modifiers: z.array(z.string()).default([])
});
export type NormalizedOrderItem = z.infer<typeof normalizedOrderItemSchema>;

export const normalizedOrderSchema = z.object({
  externalOrderId: z.string().min(1),
  platform: platformSchema,
  platformStoreId: z.string().min(1),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  fulfillmentType: fulfillmentTypeSchema,
  deliveryAddress: z.string().optional().nullable(),
  orderNotes: z.string().optional().nullable(),
  items: z.array(normalizedOrderItemSchema).min(1),
  subtotal: moneySchema,
  tax: moneySchema,
  deliveryFee: moneySchema,
  serviceFee: moneySchema,
  total: moneySchema,
  paymentStatus: paymentStatusSchema,
  orderStatus: orderStatusSchema.default("new"),
  kitchenStatus: kitchenStatusSchema.default("new"),
  createdAt: z.string().datetime(),
  scheduledFor: z.string().datetime().optional().nullable(),
  rawPayload: z.unknown(),
  ingestionSource: ingestionSourceSchema,
  syncState: syncStateSchema.default("pending"),
  errorState: z.string().optional().nullable()
});
export type NormalizedOrder = z.infer<typeof normalizedOrderSchema>;

export const orderFiltersSchema = z.object({
  platform: platformSchema.optional(),
  status: orderStatusSchema.optional(),
  fulfillmentType: fulfillmentTypeSchema.optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});
export type OrderFilters = z.infer<typeof orderFiltersSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: roleSchema
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const authResponseSchema = z.object({
  user: authUserSchema,
  tokens: authTokensSchema
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const orderSummarySchema = z.object({
  totalOrders: z.number().int().nonnegative(),
  newOrders: z.number().int().nonnegative(),
  preparingOrders: z.number().int().nonnegative(),
  readyOrders: z.number().int().nonnegative(),
  revenueToday: z.number().nonnegative(),
  platformBreakdown: z.array(
    z.object({
      platform: platformSchema,
      count: z.number().int().nonnegative(),
      revenue: z.number().nonnegative()
    })
  )
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const orderCardSchema = z.object({
  id: z.string(),
  internalOrderNumber: z.string(),
  externalOrderId: z.string(),
  platform: platformSchema,
  customerName: z.string().nullable(),
  fulfillmentType: fulfillmentTypeSchema,
  total: moneySchema,
  orderStatus: orderStatusSchema,
  kitchenStatus: kitchenStatusSchema,
  createdAt: z.string().datetime(),
  orderNotes: z.string().nullable(),
  itemCount: z.number().int().positive(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      notes: z.string(),
      modifiers: z.array(z.string())
    })
  )
});
export type OrderCard = z.infer<typeof orderCardSchema>;

export const orderDetailSchema = orderCardSchema.extend({
  deliveryAddress: z.string().nullable(),
  customerPhone: z.string().nullable(),
  subtotal: moneySchema,
  tax: moneySchema,
  deliveryFee: moneySchema,
  serviceFee: moneySchema,
  paymentStatus: paymentStatusSchema,
  syncState: syncStateSchema,
  events: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      fromStatus: orderStatusSchema.nullable().optional(),
      toStatus: orderStatusSchema.nullable().optional(),
      createdAt: z.string().datetime()
    })
  ),
  rawIngestionEvent: z
    .object({
      id: z.string(),
      source: ingestionSourceSchema,
      status: z.string(),
      errorMessage: z.string().nullable()
    })
    .nullable()
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const analyticsSummarySchema = z.object({
  revenueByPlatform: z.record(z.number().nonnegative()),
  countsByPlatform: z.record(z.number().int().nonnegative()),
  countsByStatus: z.record(z.number().int().nonnegative()),
  averagePreparationMinutes: z.number().nonnegative(),
  totalOrders: z.number().int().nonnegative()
});
export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;

export const settingsSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    timezone: z.string(),
    currency: z.string(),
    address: z.string(),
    phone: z.string().nullable(),
    alertSoundEnabled: z.boolean(),
    autoRefreshSeconds: z.number().int(),
    platformConnections: z.array(
      z.object({
        id: z.string(),
        platform: platformSchema,
        externalStoreId: z.string(),
        isEnabled: z.boolean(),
        usesEmailFallback: z.boolean()
      })
    )
  })
  .nullable();
export type SettingsDto = z.infer<typeof settingsSchema>;

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.record(z.unknown()).optional()
  });

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string()
  })
});

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = z.infer<typeof apiErrorSchema>;

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
