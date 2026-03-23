import type { AuthenticatedUser } from '../../common/types';
import { AppError } from '../../common/errors/appError';
import { ERROR_CODES } from '../../common/errors/errorCodes';

export const loginUser = async (): Promise<never> => {
  throw new AppError(501, ERROR_CODES.AUTH_006);
};

export const getCurrentUser = async (
  user: AuthenticatedUser | undefined,
): Promise<AuthenticatedUser | null> => user ?? null;
