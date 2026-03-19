import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../common/errors/appError';
import { ERROR_CODES } from '../common/errors/errorCodes';

const projectScopeSchema = z.coerce.number().int().positive();

export const projectScopeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const projectIdValue = req.params.projectId ?? req.headers['x-project-id'];

    if (!projectIdValue) {
      throw new AppError(400, ERROR_CODES.AUTH_005);
    }

    const projectId = projectScopeSchema.parse(projectIdValue);
    req.projectScope = { projectId };

    next();
  } catch (err: unknown) {
    next(err);
  }
};
