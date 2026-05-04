import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { ERROR_CODES } from "../utils/errorCodes";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: ERROR_CODES.VAL_001,
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        message: ERROR_CODES.DATA_002,
      });
      return;
    }

    if (err.code === "P2003") {
      res.status(409).json({
        success: false,
        message:
          "Operation failed because the record is referenced by other records",
      });
      return;
    }
  }

  // Postgres unique violation
  if ((err as NodeJS.ErrnoException).code === "23505") {
    res.status(409).json({ success: false, message: ERROR_CODES.DATA_002 });
    return;
  }

  // Postgres foreign key violation
  if ((err as NodeJS.ErrnoException).code === "23503") {
    res.status(409).json({
      success: false,
      message:
        "Operation failed because the record is referenced by other records",
    });
    return;
  }

  res.status(500).json({ success: false, message: ERROR_CODES.SYS_001 });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: ERROR_CODES.DATA_001 });
};
