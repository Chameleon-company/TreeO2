import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __treeo2Prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__treeo2Prisma__ ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__treeo2Prisma__ = prisma;
}
