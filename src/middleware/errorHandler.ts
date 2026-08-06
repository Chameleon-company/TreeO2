import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { customError, CustomError, ErrorCode } from "../utils/errorCodes";

export class AppError extends Error {
	statusCode: number;
	detail?: string;
	code: ErrorCode;

	constructor(statusCode: number, errorType: CustomError, detail?: string) {
		super(errorType.message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.code = errorType.code;
		this.detail = detail;
	}
}

export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	logger.error(err.message, {
		stack: err.stack,
		url: req.url,
		method: req.method,
	});

	if (err instanceof AppError) {
		res.status(err.statusCode).json({
			success: false,
			error: {
				code: err.code,
				message: err.message,
				detail: err.detail,
			},
		});
		return;
	}

	if (err instanceof ZodError) {
		const error = customError("VAL_001");
		res.status(400).json({
			success: false,
			error: {
				code: error.code,
				message: error.message,
				detail: err.flatten().fieldErrors,
			},
		});
		return;
	}

	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			const error = customError("DATA_002");
			res.status(409).json({
				success: false,
				error: {
					code: error.code,
					message: error.message,
				},
			});
			return;
		}

		if (err.code === "P2003") {
			const error = customError("DATA_003");
			res.status(409).json({
				success: false,
				error: {
					code: error.code,
					message: error.message,
				},
			});
			return;
		}
	}

	// Postgres unique violation
	if ((err as NodeJS.ErrnoException).code === "23505") {
		const error = customError("DATA_002");
		res.status(409).json({
			success: false,
			error: {
				code: error.code,
				message: error.message,
			},
		});
		return;
	}

	// Postgres foreign key violation
	if ((err as NodeJS.ErrnoException).code === "23503") {
		const error = customError("DATA_003");
		res.status(409).json({
			success: false,
			error: {
				code: error.code,
				message: error.message,
			},
		});
		return;
	}

	const error = customError("SYS_001");
	res.status(500).json({
		success: false,
		error: {
			code: error.code,
			message: error.message,
		},
	});
};

export const notFound = (req: Request, res: Response): void => {
	const err = customError("DATA_001");
	res.status(404).json({
		success: false,
		error: {
			code: err.code,
			message: err.message,
		},
	});
};
