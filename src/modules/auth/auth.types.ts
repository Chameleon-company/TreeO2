export const ROLE_NAMES = [
  "FARMER",
  "INSPECTOR",
  "MANAGER",
  "ADMIN",
  "DEVELOPER",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export type TokenScope = "identity" | "project";

export interface OrganisationRolePayload {
  organisationId: number;
  organisationRole: string;
}

export interface IdentityJwtPayload {
  scope: "identity";
  sub: string;
  userId: number;
  systemRole?: string | null;
  organisations?: OrganisationRolePayload[];
  role?: RoleName;
}

export interface ProjectJwtPayload {
  scope: "project";
  sub: string;
  userId: number;
  projectId: number;
  systemRole?: string | null;
  organisationId: number;
  organisationRole: string;
  projectRoles: string[];
  role?: RoleName;
}

export type JwtPayload = IdentityJwtPayload | ProjectJwtPayload;

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
