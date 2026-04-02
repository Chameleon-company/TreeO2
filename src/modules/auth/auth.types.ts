export const ROLE_NAMES = [
  "FARMER",
  "INSPECTOR",
  "MANAGER",
  "ADMIN",
  "DEVELOPER",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export interface JwtPayload {
  sub: string;
  email?: string | null;
  role: RoleName;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface ForgotPasswordRequestBody {
  email: string;
}

export interface ResetPasswordRequestBody {
  token: string;
  password: string;
}

export interface AuthRouteResponse {
  success: boolean;
  message: string;
  code?: string;
}
