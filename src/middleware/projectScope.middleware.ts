import type { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { customError } from "../utils/errorCodes";

export const projectScopeMiddleware = (
	req: Request,
	_res: Response,
	next: NextFunction,
): void => {
	const projectIdHeader = req.headers["x-project-id"];
	const projectId =
		typeof projectIdHeader === "string" ? Number(projectIdHeader) : NaN;

	if (!Number.isInteger(projectId) || projectId <= 0) {
		next(new AppError(403, customError("AUTH_007")));
		return;
	}

	req.projectScope = { projectId };
	next();
};
