import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { customError } from "../utils/errorCodes";

/**
 * Specification v1.3 Section 5 (Project-Scoped JWT Contract) Middleware
 * Extracts project scope headers and validates positive integer project boundaries.
 */
export const projectScopeMiddleware = (
	req: Request,
	_res: Response,
	next: NextFunction,
): void => {
	if (!req.user) {
		next(new AppError(401, customError("AUTH_003")));
		return;
	}

	// AUTH04 Rule 1: SystemAdmin Override
	// [AUTH-CLEANUP] Note: This bypass is a temporary migration workaround until the select-project endpoint is live.
	// SystemAdmins can operate globally, so a project scope is optional.
	// We extract it if provided via token (or legacy header), but allow them through if missing.
	if (req.user.systemRole === "SystemAdmin") {
		let adminProjectId = "projectId" in req.user ? req.user.projectId : NaN;
		if (!adminProjectId || Number.isNaN(adminProjectId)) {
			const headerVal = req.get("x-project-id") || req.headers["x-project-id"];
			adminProjectId = typeof headerVal === "string" ? Number(headerVal) : NaN;
		}
		if (
			adminProjectId &&
			Number.isInteger(adminProjectId) &&
			adminProjectId > 0
		) {
			req.projectScope = { projectId: adminProjectId };
		}
		next();
		return;
	}

	// We allow them through to the fallback, where they must provide x-project-id.
	// TODO (Phase 2): This MUST be changed to `!("scope" in req.user) || req.user.scope !== "project"`
	// once all clients migrate to v1.3 tokens, otherwise tokens without a scope could dangerously bypass.
	if ("scope" in req.user && req.user.scope !== "project") {
		next(new AppError(403, customError("AUTH_008")));
		return;
	}

	let projectId = "projectId" in req.user ? req.user.projectId : NaN;

	// [TECH DEBT / VELOCITY STUB] Legacy Header Fallback
	// Older JWTs do not have 'projectId' in the payload. They rely on the x-project-id header.
	// This fallback MUST be removed in AUTH-CLEANUP once all clients are migrated to v1.3 tokens.
	if (!projectId || Number.isNaN(projectId)) {
		const projectIdHeader =
			req.get("x-project-id") || req.headers["x-project-id"];
		projectId =
			typeof projectIdHeader === "string" ? Number(projectIdHeader) : NaN;
	}

	if (!projectId || !Number.isInteger(projectId) || projectId <= 0) {
		next(new AppError(403, customError("AUTH_007")));
		return;
	}

	req.projectScope = { projectId };
	next();
};
