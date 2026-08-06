import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { z } from "zod";
import { env } from "../config/env";
import {
	SYSTEM_ROLE_NAMES,
	ORGANISATION_ROLE_NAMES,
	type JwtPayload,
	type IdentityJwtPayload,
	type IdentityJwtInfo,
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

const IDENTITY_TOKEN_EXPIRY = "15m";

// Signs a short-lived Identity JWT; jti is generated here, iat/exp are added automatically by jwt.sign()
export const signIdentityJwt = (payload: IdentityJwtInfo): string =>
	jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_SECRET as Secret, {
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
	const decoded = jwt.verify(token, env.JWT_SECRET as Secret, {
		algorithms: ["HS256"],
	});

	return identityJwtPayloadSchema.parse(decoded);
};
