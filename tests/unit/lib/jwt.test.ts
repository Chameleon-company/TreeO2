import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { signIdentityJwt, verifyIdentityJwt } from "../../../src/lib/jwt";

describe("Identity JWT signing and verification", () => {
	const basePayload = {
		sub: "42",
		userId: 42,
		organisations: [{ organisationId: 1, organisationRole: "Member" as const }],
		scope: "identity" as const,
	};

	it("signs a token that verifies successfully and returns the original payload", () => {
		const token = signIdentityJwt(basePayload);
		const result = verifyIdentityJwt(token);

		expect(result.userId).toBe(42);
		expect(result.sub).toBe("42");
		expect(result.scope).toBe("identity");
		expect(result.organisations).toEqual(basePayload.organisations);
	});

	it("includes a generated jti and expiry on the signed token", () => {
		const token = signIdentityJwt(basePayload);
		const decoded = jwt.decode(token) as { jti?: string; exp?: number };

		expect(decoded.jti).toEqual(expect.any(String));
		expect(decoded.exp).toEqual(expect.any(Number));
	});

	it("rejects a token that isn't scoped as identity", () => {
		const projectScopedToken = jwt.sign(
			{ ...basePayload, scope: "project" },
			process.env.JWT_SECRET as string,
		);

		expect(() => verifyIdentityJwt(projectScopedToken)).toThrow(ZodError);
	});

	it("rejects a token with a malformed payload (e.g. wrong field type)", () => {
		const malformedToken = jwt.sign(
			{ ...basePayload, userId: "not-a-number" },
			process.env.JWT_SECRET as string,
		);

		expect(() => verifyIdentityJwt(malformedToken)).toThrow(ZodError);
	});
});
