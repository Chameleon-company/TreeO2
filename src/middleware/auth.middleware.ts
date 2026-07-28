// Auth Middleware - Handles JWT verification and development token bypass engine
import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../lib/jwt";
import type { JwtPayload } from "../modules/auth/auth.types";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { ERROR_CODES } from "../utils/errorCodes";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next(new AppError(401, ERROR_CODES.AUTH_003, "AUTH_003: Authentication required"));
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(new AppError(401, ERROR_CODES.AUTH_003, "AUTH_003: Authentication required"));
    return;
  }

  // Development-only bypass mode for API testing
  if (env.NODE_ENV === "development" && env.AUTH_DEV_MODE) {
    const devTokenUsers = new Map<string, JwtPayload>();

    if (env.AUTH_DEV_ADMIN_TOKEN) {
      devTokenUsers.set(env.AUTH_DEV_ADMIN_TOKEN, {
        sub: "1",
        userId: 1,
        scope: "identity",
        systemRole: "SystemAdmin",
        role: "ADMIN",
      });
    }

    if (env.AUTH_DEV_FARMER_TOKEN) {
      devTokenUsers.set(env.AUTH_DEV_FARMER_TOKEN, {
        sub: "2",
        userId: 2,
        scope: "project",
        projectId: 1,
        organisationId: 1,
        organisationRole: "Member",
        projectRoles: ["Farmer"],
        role: "FARMER",
      });
    }

    if (env.AUTH_DEV_MANAGER_TOKEN) {
      devTokenUsers.set(env.AUTH_DEV_MANAGER_TOKEN, {
        sub: "3",
        userId: 3,
        scope: "project",
        projectId: 1,
        organisationId: 1,
        organisationRole: "Member",
        projectRoles: ["Manager"],
        role: "MANAGER",
      });
    }

    if (env.AUTH_DEV_INSPECTOR_TOKEN) {
      devTokenUsers.set(env.AUTH_DEV_INSPECTOR_TOKEN, {
        sub: "4",
        userId: 4,
        scope: "project",
        projectId: 1,
        organisationId: 1,
        organisationRole: "Member",
        projectRoles: ["Inspector"],
        role: "INSPECTOR",
      });
    }

    if (env.AUTH_DEV_DEVELOPER_TOKEN) {
      devTokenUsers.set(env.AUTH_DEV_DEVELOPER_TOKEN, {
        sub: "5",
        userId: 5,
        scope: "project",
        projectId: 1,
        organisationId: 1,
        organisationRole: "Member",
        projectRoles: ["Developer"],
        role: "DEVELOPER",
      });
    }

    if (env.AUTH_DEV_ORG_ADMIN_TOKEN) {
      devTokenUsers.set(env.AUTH_DEV_ORG_ADMIN_TOKEN, {
        sub: "6",
        userId: 6,
        scope: "project",
        projectId: 1,
        organisationId: 1,
        organisationRole: "OrganisationAdmin",
        projectRoles: [],
      });
    }

    if (env.AUTH_DEV_SUPPORT_ADMIN_TOKEN) {
      devTokenUsers.set(env.AUTH_DEV_SUPPORT_ADMIN_TOKEN, {
        sub: "7",
        userId: 7,
        scope: "identity",
        systemRole: "SupportAdmin",
      });
    }

    const devUser = devTokenUsers.get(token);

    if (devUser) {
      req.user = devUser;
      next();
      return;
    }
  }

  // Production JWT Verification Flow
  try {
    const payload = verifyJwt(token);
    req.user = payload;
    next();
  } catch (_error) {
    next(new AppError(401, ERROR_CODES.AUTH_003, "AUTH_003: Authentication required"));
  }
};
