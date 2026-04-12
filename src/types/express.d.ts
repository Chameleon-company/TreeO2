import type { JwtPayload } from "../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      projectScope?: {
        projectId: number;
      };
      requestId?: string;
    }
  }
}

export {};
