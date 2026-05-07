import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../config/logger";

export const securityAuditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.requestId = randomUUID();

  // Log incoming request
  logger.info("Incoming request", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    hasAuthorizationHeader: Boolean(req.headers.authorization),
  });

  // Log outcome when response finishes
  res.on("finish", () => {
    const user = req.user;

    logger.info("Request completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      statusCode: res.statusCode,
      success: res.statusCode < 400,
      // Log user context if authenticated
      userId: user?.sub ?? null,
      role: user?.role ?? null,
      email: user?.email ?? null,
    });
  });

  next();
};
