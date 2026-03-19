import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var
  var __treeo2Prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__treeo2Prisma__ ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__treeo2Prisma__ = prisma;
}
