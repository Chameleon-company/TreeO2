import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

export const securityAuditMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.path.includes('/auth') || req.headers.authorization) {
    logger.info('Security audit event', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      hasAuthorizationHeader: Boolean(req.headers.authorization),
      ip: req.ip,
    });
  }

  next();
};
