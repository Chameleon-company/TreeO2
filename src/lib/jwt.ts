import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import {
	JwtPayloadSchema,
	IdentityJwtPayloadSchema,
  ProjectJwtPayloadSchema,
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

export const verifyJwt = (token: string): JwtPayload => {
	const rawPayload = jwt.verify(token, env.JWT_SECRET as Secret, {
		algorithms: ["HS256"],
	});
	return JwtPayloadSchema.parse(rawPayload);
};

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

// Verifies a token and validates it's a well-formed Identity-scoped JWT via Zod;
// throws ZodError (handled centrally by errorHandler.ts) if the decoded payload
// doesn't match the expected shape/scope
export const verifyIdentityJwt = (token: string): IdentityJwtPayload => {
	const decoded = jwt.verify(token, requireJwtSecret(), {
		algorithms: ["HS256"],
	});

	return IdentityJwtPayloadSchema.parse(decoded);
};

const PROJECT_TOKEN_EXPIRY = "15m";

// Signs a short-lived Project-Scoped JWT; jti is generated here, iat/exp are added automatically
export const signProjectJwt = (payload: ProjectJwtInfo): string =>
	jwt.sign({ ...payload, jti: randomUUID() }, requireJwtSecret(), {
		expiresIn: PROJECT_TOKEN_EXPIRY,
		algorithm: "HS256",
	});

// Verifies a token and validates it's a well-formed Project-Scoped JWT via Zod;
// throws ZodError (handled centrally by errorHandler.ts) if the decoded payload
// doesn't match the expected shape/scope
export const verifyProjectJwt = (token: string): ProjectJwtPayload => {
	const decoded = jwt.verify(token, requireJwtSecret(), {
		algorithms: ["HS256"],
	});

	return ProjectJwtPayloadSchema.parse(decoded);
};