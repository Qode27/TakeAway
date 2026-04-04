import prismaClientPkg from "@prisma/client";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

const { PrismaClient } = prismaClientPkg;

declare global {
  var __prisma__: PrismaClientType | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
