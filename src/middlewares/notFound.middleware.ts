import type { Request, Response } from 'express';
import { ERROR_CODES } from '../common/errors/errorCodes';

export const notFoundMiddleware = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: ERROR_CODES.DATA_001,
  });
};
