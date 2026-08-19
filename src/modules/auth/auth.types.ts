import { z } from "zod";

export const ROLE_NAMES = [
	"FARMER",
	"INSPECTOR",
	"MANAGER",
	"ADMIN",
	"DEVELOPER",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export type TokenScope = "identity" | "project";

export const OrganisationRolePayloadSchema = z.object({
	organisationId: z.number(),
	organisationRole: z.string(),
});
export type OrganisationRolePayload = z.infer<
	typeof OrganisationRolePayloadSchema
>;

export const IdentityJwtPayloadSchema = z.object({
	scope: z.literal("identity"),
	sub: z.string(),
	userId: z.number(),
	systemRole: z.string().nullable().optional(),
	organisations: z.array(OrganisationRolePayloadSchema).optional(),
	role: z.enum(ROLE_NAMES).optional(),
});
export type IdentityJwtPayload = z.infer<typeof IdentityJwtPayloadSchema>;

export const ProjectJwtPayloadSchema = z.object({
	scope: z.literal("project"),
	sub: z.string(),
	userId: z.number(),
	projectId: z.number(),
	systemRole: z.string().nullable().optional(),
	organisationId: z.number(),
	organisationRole: z.string(),
	projectRoles: z.array(z.string()),
	role: z.enum(ROLE_NAMES).optional(),
});
export type ProjectJwtPayload = z.infer<typeof ProjectJwtPayloadSchema>;

/**
 * Legacy schema retained for backwards compatibility with active branches (e.g. user-management, adopters, projects)
 * during systematic migration to capability-driven auth (Task T2 2026 - AUTH05)
 *
 * @deprecated This schema will be removed in POSTAUTH. Use IdentityJwtPayloadSchema or ProjectJwtPayloadSchema instead.
 */
export const LegacyJwtPayloadSchema = z.object({
	id: z.number().optional(),
	sub: z.string().optional(),
	userId: z.number().optional(),
	role: z.enum(ROLE_NAMES).optional(),
	systemRole: z.string().nullable().optional(),
	scope: z.enum(["identity", "project"]).optional(),
	projectIds: z.array(z.number()).optional(),
});
export type LegacyJwtPayload = z.infer<typeof LegacyJwtPayloadSchema>;

export const JwtPayloadSchema = z.union([
	IdentityJwtPayloadSchema,
	ProjectJwtPayloadSchema,
	LegacyJwtPayloadSchema,
]);
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

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
