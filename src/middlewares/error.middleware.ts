import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/appError';
import { ERROR_CODES } from '../common/errors/errorCodes';
import { logger } from '../config/logger';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: ERROR_CODES.VAL_001,
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: ERROR_CODES.DATA_002,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: ERROR_CODES.SYS_001,
  });
};
