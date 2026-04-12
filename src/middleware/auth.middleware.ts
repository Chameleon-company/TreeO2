import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../lib/jwt";
import { AppError } from "../middleware/errorHandler";
import { ERROR_CODES } from "../utils/errorCodes";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError(401, ERROR_CODES.AUTH_003, "AUTH_003"));
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifyJwt(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, ERROR_CODES.AUTH_005, "AUTH_005"));
  }
};
