import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { verifyJwt } from "../lib/jwt";
import type { JwtPayload } from "../modules/auth/auth.types";
import { AppError } from "../middleware/errorHandler";
import { ERROR_CODES } from "../utils/errorCodes";

const DEV_TOKEN_USERS: Record<string, JwtPayload> = {
  [env.AUTH_DEV_ADMIN_TOKEN]: {
    sub: "1",
    email: "dev-admin@treeo2.local",
    role: "ADMIN",
  },
  [env.AUTH_DEV_FARMER_TOKEN]: {
    sub: "2",
    email: "dev-farmer@treeo2.local",
    role: "FARMER",
  },
  [env.AUTH_DEV_MANAGER_TOKEN]: {
    sub: "3",
    email: "dev-manager@treeo2.local",
    role: "MANAGER",
  },
  [env.AUTH_DEV_INSPECTOR_TOKEN]: {
    sub: "4",
    email: "dev-inspector@treeo2.local",
    role: "INSPECTOR",
  },
  [env.AUTH_DEV_DEVELOPER_TOKEN]: {
    sub: "5",
    email: "dev-developer@treeo2.local",
    role: "DEVELOPER",
  },
};

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

  if (env.NODE_ENV === "development" && env.AUTH_DEV_MODE) {
    const devUser = DEV_TOKEN_USERS[token];

    if (devUser) {
      req.user = devUser;
      next();
      return;
    }
  }

  try {
    const payload = verifyJwt(token);
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, ERROR_CODES.AUTH_005, "AUTH_005"));
  }
};
