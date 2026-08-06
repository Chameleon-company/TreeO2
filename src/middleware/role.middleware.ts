import type { NextFunction, Request, Response } from "express";
import type { RoleName } from "../modules/auth/auth.types";
import { AppError } from "../middleware/errorHandler";
import { customError } from "../utils/errorCodes";

export const roleMiddleware =
	(allowedRoles: RoleName[]) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		if (!req.user) {
			next(new AppError(401, customError("AUTH_003")));
			return;
		}

		if (!allowedRoles.includes(req.user.role)) {
			next(new AppError(403, customError("AUTH_004")));
			return;
		}

		next();
	};
