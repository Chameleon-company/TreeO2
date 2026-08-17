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

// System-level roles: global scope, not tied to any organisation or project (v1.3 Section 6.1)
export const SYSTEM_ROLE_NAMES = [
	"SystemAdmin",
	"SupportAdmin",
	"ReadOnly",
] as const;
export type SystemRoleName = (typeof SYSTEM_ROLE_NAMES)[number];

// Organisation-level roles: scoped to a single organisation membership (v1.3 Section 6.2)
export const ORGANISATION_ROLE_NAMES = ["OrganisationAdmin", "Member"] as const;
export type OrganisationRoleName = (typeof ORGANISATION_ROLE_NAMES)[number];

// One organisation membership entry listed inside an Identity JWT
export interface IdentityOrganisationMembership {
	organisationId: number;
	organisationRole: OrganisationRoleName;
}

// Identity JWT claims that exist before signing (jti/iat/exp are added at signing time)
export interface IdentityJwtInfo {
	sub: string;
	userId: number;
	systemRole?: SystemRoleName;
	organisations: IdentityOrganisationMembership[];
	scope: "identity";
}

// Identity JWT payload: proves who the user is, not what they can do on any specific project
export interface IdentityJwtPayload extends IdentityJwtInfo {
	jti: string;
	iat: number;
	exp: number;
}

// Project-level roles: scoped to a single project assignment (v1.3 Section 6.3)
export const PROJECT_ROLE_NAMES = ["Farmer", "Inspector", "Manager"] as const;
export type ProjectRoleName = (typeof PROJECT_ROLE_NAMES)[number];

// Project JWT claims that exist before signing (jti/iat/exp are added at signing time)
export interface ProjectJwtInfo {
	sub: string;
	userId: number;
	projectId: number;
	systemRole?: SystemRoleName;
	organisationId: number;
	organisationRole: OrganisationRoleName;
	projectRoles: ProjectRoleName[];
	scope: "project";
}

// Project-Scoped JWT payload: issued after /auth/select-project, tied to exactly one project
export interface ProjectJwtPayload extends ProjectJwtInfo {
	jti: string;
	iat: number;
	exp: number;
}
