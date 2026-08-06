import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import type {
	JwtPayload,
	IdentityJwtPayload,
	IdentityJwtInfo,
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

// Verifies a token and asserts it's an Identity-scoped JWT; throws if signature/expiry invalid or scope mismatched
export const verifyIdentityJwt = (token: string): IdentityJwtPayload => {
	const decoded = jwt.verify(token, env.JWT_SECRET as Secret, {
		algorithms: ["HS256"],
	}) as IdentityJwtPayload;

	if (decoded.scope !== "identity") {
		throw new Error("Invalid token scope: expected identity token");
	}

	return decoded;
};
