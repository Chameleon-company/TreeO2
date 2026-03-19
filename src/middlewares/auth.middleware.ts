import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/errors/appError';
import { ERROR_CODES } from '../common/errors/errorCodes';
import type { AuthenticatedUser } from '../common/types';
import { verifyAccessToken } from '../lib/jwt';

const parseBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = parseBearerToken(req);

    if (!token) {
      throw new AppError(401, ERROR_CODES.AUTH_001);
    }

    const payload = verifyAccessToken(token);

    const user: AuthenticatedUser = {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email ?? null,
      role: payload.role,
    };

    req.user = user;
    next();
  } catch (err: unknown) {
    if (err instanceof AppError) {
      next(err);
      return;
    }

    next(new AppError(401, ERROR_CODES.AUTH_002));
  }
};
