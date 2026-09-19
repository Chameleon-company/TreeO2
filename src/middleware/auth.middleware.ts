import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../lib/jwt";
import { AppError } from "../middleware/errorHandler";
import { customError } from "../utils/errorCodes";

/**
 * Specification v1.3 Section 14 Authentication Middleware
 * Enforces Bearer token presence and production JWT signature validation.
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

	// 2. Production Cryptographic JWT Signature Verification
	try {
		const payload = verifyJwt(token);
		req.user = payload;
		next();
	} catch {
		next(new AppError(401, customError("AUTH_005")));
	}
};
