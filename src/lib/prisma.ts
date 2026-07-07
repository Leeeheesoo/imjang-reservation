import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// @ts-expect-error - Prisma 7 type compatibility
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // SQLite datasource
  } as any);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
