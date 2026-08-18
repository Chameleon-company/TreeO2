import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { z } from "zod";
import { env } from "../config/env";
import {
	SYSTEM_ROLE_NAMES,
	ORGANISATION_ROLE_NAMES,
	PROJECT_ROLE_NAMES,
	type JwtPayload,
	type IdentityJwtPayload,
	type IdentityJwtInfo,
	type ProjectJwtPayload,
	type ProjectJwtInfo,
} from "../modules/auth/auth.types";

export const signJwt = (payload: JwtPayload): string =>
	jwt.sign(payload, env.JWT_SECRET as Secret, {
		expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
		algorithm: "HS256",
	});

export const verifyJwt = (token: string): JwtPayload =>
	jwt.verify(token, env.JWT_SECRET as Secret, {
		algorithms: ["HS256"],
	}) as JwtPayload;

const requireJwtSecret = (): string => {
	if (!env.JWT_SECRET) {
		throw new Error("JWT_SECRET is not configured");
	}
	return env.JWT_SECRET;
};

const IDENTITY_TOKEN_EXPIRY = "15m";

// Signs a short-lived Identity JWT; jti is generated here, iat/exp are added automatically by jwt.sign()
export const signIdentityJwt = (payload: IdentityJwtInfo): string =>
	jwt.sign({ ...payload, jti: randomUUID() }, requireJwtSecret(), {
		expiresIn: IDENTITY_TOKEN_EXPIRY,
		algorithm: "HS256",
	});

const identityJwtPayloadSchema = z.object({
	sub: z.string(),
	userId: z.number(),
	systemRole: z.enum(SYSTEM_ROLE_NAMES).optional(),
	organisations: z.array(
		z.object({
			organisationId: z.number(),
			organisationRole: z.enum(ORGANISATION_ROLE_NAMES),
		}),
	),
	scope: z.literal("identity"),
	jti: z.string(),
	iat: z.number(),
	exp: z.number(),
});

// Verifies a token and validates it's a well-formed Identity-scoped JWT via Zod;
// throws ZodError (handled centrally by errorHandler.ts) if the decoded payload
// doesn't match the expected shape/scope
export const verifyIdentityJwt = (token: string): IdentityJwtPayload => {
	const decoded = jwt.verify(token, requireJwtSecret(), {
		algorithms: ["HS256"],
	});

	return identityJwtPayloadSchema.parse(decoded);
};

const PROJECT_TOKEN_EXPIRY = "15m";

// Signs a short-lived Project-Scoped JWT; jti is generated here, iat/exp are added automatically
export const signProjectJwt = (payload: ProjectJwtInfo): string =>
	jwt.sign({ ...payload, jti: randomUUID() }, requireJwtSecret(), {
		expiresIn: PROJECT_TOKEN_EXPIRY,
		algorithm: "HS256",
	});

const projectJwtPayloadSchema = z.object({
	sub: z.string(),
	userId: z.number(),
	projectId: z.number(),
	systemRole: z.enum(SYSTEM_ROLE_NAMES).optional(),
	organisationId: z.number(),
	organisationRole: z.enum(ORGANISATION_ROLE_NAMES),
	projectRoles: z.array(z.enum(PROJECT_ROLE_NAMES)),
	scope: z.literal("project"),
	jti: z.string(),
	iat: z.number(),
	exp: z.number(),
});

// Verifies a token and validates it's a well-formed Project-Scoped JWT via Zod;
// throws ZodError (handled centrally by errorHandler.ts) if the decoded payload
// doesn't match the expected shape/scope
export const verifyProjectJwt = (token: string): ProjectJwtPayload => {
	const decoded = jwt.verify(token, requireJwtSecret(), {
		algorithms: ["HS256"],
	});

	return projectJwtPayloadSchema.parse(decoded);
};
