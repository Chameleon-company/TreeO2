import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import {
	signIdentityJwt,
	verifyIdentityJwt,
	signProjectJwt,
	verifyProjectJwt,
} from "../../../src/lib/jwt";

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
		const decoded = jwt.decode(token);

		expect(decoded).toEqual(
			expect.objectContaining({
				jti: expect.any(String),
				exp: expect.any(Number),
			}),
		);
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

describe("Project-Scoped JWT signing and verification", () => {
	const basePayload = {
		sub: "42",
		userId: 42,
		projectId: 7,
		organisationId: 1,
		organisationRole: "Member" as const,
		projectRoles: ["Manager" as const],
		scope: "project" as const,
	};

	it("signs a token that verifies successfully and returns the original payload", () => {
		const token = signProjectJwt(basePayload);
		const result = verifyProjectJwt(token);

		expect(result.userId).toBe(42);
		expect(result.projectId).toBe(7);
		expect(result.scope).toBe("project");
		expect(result.projectRoles).toEqual(basePayload.projectRoles);
	});

	it("includes a generated jti and expiry on the signed token", () => {
		const token = signProjectJwt(basePayload);
		const decoded = jwt.decode(token);

		expect(decoded).toEqual(
			expect.objectContaining({
				jti: expect.any(String),
				exp: expect.any(Number),
			}),
		);
	});

	it("rejects a token that isn't scoped as project", () => {
		const identityScopedToken = jwt.sign(
			{ ...basePayload, scope: "identity" },
			process.env.JWT_SECRET as string,
		);

		expect(() => verifyProjectJwt(identityScopedToken)).toThrow(ZodError);
	});

	it("rejects a token with a malformed payload (e.g. wrong field type)", () => {
		const malformedToken = jwt.sign(
			{ ...basePayload, projectId: "not-a-number" },
			process.env.JWT_SECRET as string,
		);

		expect(() => verifyProjectJwt(malformedToken)).toThrow(ZodError);
	});
});
