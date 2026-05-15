import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../config/logger";

export const securityAuditMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  req.requestId = randomUUID();

  logger.info("Security audit", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    hasAuthorizationHeader: Boolean(req.headers.authorization),
  });

  next();
};
