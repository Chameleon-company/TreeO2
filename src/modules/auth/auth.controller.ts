import type { Request, Response } from 'express';
import { AppError } from '../../common/errors/appError';
import { ERROR_CODES } from '../../common/errors/errorCodes';

export const login = (req: Request, res: Response): void => {
  void req;
  void res;

  throw new AppError(501, ERROR_CODES.AUTH_006);
};

export const me = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: req.user ?? null,
  });
};
