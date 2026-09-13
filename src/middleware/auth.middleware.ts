import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { verifyJwt } from "../lib/jwt";
import type { JwtPayload } from "../modules/auth/auth.types";
import { AppError } from "../middleware/errorHandler";
import { customError } from "../utils/errorCodes";

/**
 * Lazy-cached Development Bypass Token Map (AUTH_DEV_MODE=true)
 */
let cachedDevTokenUsers: Map<string, JwtPayload> | null = null;

const getDevTokenUsers = (): Map<string, JwtPayload> => {
	if (cachedDevTokenUsers) {
		return cachedDevTokenUsers;
	}

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

	cachedDevTokenUsers = devTokenUsers;
	return cachedDevTokenUsers;
};

/**
 * Specification v1.3 Section 14 Authentication Middleware
 * Enforces Bearer token presence, dev token bypass engine, and production JWT signature validation.
 */
export const authMiddleware = (
	req: Request,
	_res: Response,
	next: NextFunction,
): void => {
	// 1. Bearer Header Presence Guard
	const authHeader = req.headers.authorization;

	if (!authHeader?.startsWith("Bearer ")) {
		next(new AppError(401, customError("AUTH_003")));
		return;
	}

	const token = authHeader.slice("Bearer ".length).trim();

	// 2. Development Bypass Token Engine (AUTH_DEV_MODE=true)
	if (
		(env.NODE_ENV === "development" || env.NODE_ENV === "test") &&
		env.AUTH_DEV_MODE
	) {
		const devUser = getDevTokenUsers().get(token);

		if (devUser) {
			req.user = devUser;
			next();
			return;
		}
	}

	// 3. Production Cryptographic JWT Signature Verification
	try {
		const payload = verifyJwt(token);
		req.user = payload;
		next();
	} catch {
		next(new AppError(401, customError("AUTH_005")));
	}
};
