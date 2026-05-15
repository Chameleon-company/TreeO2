import type { NextFunction, Request, Response } from "express";
import type { RoleName } from "../modules/auth/auth.types";
import { AppError } from "../middleware/errorHandler";
import { ERROR_CODES } from "../utils/errorCodes";

export const roleMiddleware =
  (allowedRoles: RoleName[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, ERROR_CODES.AUTH_003, "AUTH_003"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, ERROR_CODES.AUTH_004, "AUTH_004"));
      return;
    }

    next();
  };
