import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { ERROR_CODES } from "../utils/errorCodes";

export const projectScopeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(
      new AppError(
        401,
        ERROR_CODES.AUTH_003,
        "AUTH_003: Authentication required",
      ),
    );
    return;
  }

  if (req.user.scope !== "project") {
    next(
      new AppError(
        403,
        ERROR_CODES.AUTH_004,
        "AUTH_004: Invalid token scope for project route",
      ),
    );
    return;
  }

  const projectId = req.user.projectId;

  if (!projectId || !Number.isInteger(projectId) || projectId <= 0) {
    next(
      new AppError(
        403,
        ERROR_CODES.AUTH_004,
        "AUTH_004: Invalid project ID in token claims",
      ),
    );
    return;
  }

  req.projectScope = { projectId };
  next();
};
