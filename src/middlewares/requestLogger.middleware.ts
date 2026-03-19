import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = req.headers['x-request-id']?.toString() ?? uuidv4();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('HTTP request completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
};
