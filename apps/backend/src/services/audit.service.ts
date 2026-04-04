import prismaClientPkg from "@prisma/client";
import type { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";

const { Prisma } = prismaClientPkg;

export async function writeAuditLog(input: {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as PrismaNamespace.InputJsonValue | undefined
    }
  });
}
