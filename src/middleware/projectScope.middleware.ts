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
	const projectIdHeader =
		req.get("x-project-id") || req.headers["x-project-id"];
	const projectId =
		typeof projectIdHeader === "string" ? Number(projectIdHeader) : NaN;

	if (!Number.isInteger(projectId) || projectId <= 0) {
		next(new AppError(403, customError("AUTH_007")));
		return;
	}

	req.projectScope = { projectId };
	next();
};
