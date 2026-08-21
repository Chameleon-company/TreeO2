import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { customError } from "../utils/errorCodes";

export const loginRateLimit = rateLimit({
	windowMs: env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
	max: env.AUTH_LOGIN_RATE_LIMIT_MAX,
	handler: (_req, _res, next) => {
		next(new AppError(429, customError("AUTH_010")));
	},
});

export const forgotPasswordRateLimit = rateLimit({
	windowMs: env.AUTH_FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS,
	max: env.AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX,
	handler: (_req, _res, next) => {
		next(new AppError(429, customError("AUTH_010")));
	},
});

export const resetPasswordRateLimit = rateLimit({
	windowMs: env.AUTH_RESET_PASSWORD_RATE_LIMIT_WINDOW_MS,
	max: env.AUTH_RESET_PASSWORD_RATE_LIMIT_MAX,
	handler: (_req, _res, next) => {
		next(new AppError(429, customError("AUTH_010")));
	},
});
