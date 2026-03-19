import type { AuthenticatedUser } from './index';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
      projectScope?: {
        projectId: number;
      };
    }
  }
}

export {};
