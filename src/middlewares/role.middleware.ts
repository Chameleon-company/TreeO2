import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/errors/appError';
import { UserRole } from '../common/enums/userRole.enum';
import { ERROR_CODES } from '../common/errors/errorCodes';

export const roleMiddleware =
  (allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, ERROR_CODES.AUTH_003));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, ERROR_CODES.AUTH_004));
      return;
    }

    next();
  };
