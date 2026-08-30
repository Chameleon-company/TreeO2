import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import { projectScopeMiddleware } from "../../../src/middleware/projectScope.middleware";
import type { ProjectJwtPayload } from "../../../src/modules/auth/auth.types";

describe("projectScopeMiddleware - Comprehensive Unit Tests", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		req = {
			headers: {},
			get: jest.fn((headerName: string) => {
				const val = req.headers?.[headerName.toLowerCase()];
				return Array.isArray(val) ? val[0] : val;
			}) as any,
		};
		res = {};
		next = jest.fn();
	});

	it("should attach req.projectScope and call next() for a valid Project-Scoped token", () => {
		const projectUser: ProjectJwtPayload = {
			sub: "123",
			userId: 123,
			scope: "project",
			projectId: 45,
			systemRole: null,
			organisationId: 10,
			organisationRole: "Member",
			projectRoles: ["Manager"],
			jti: "test-jti",
			iat: 1710000000,
			exp: 1710000900,
		};

		req.user = projectUser;
		req.headers = { "x-project-id": "45" };

		projectScopeMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
		expect(req.projectScope).toEqual({ projectId: 45 });
	});

	it("should reject requests with missing x-project-id header with 403 (AUTH_007)", () => {
		req.headers = {};

		projectScopeMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0];
		expect(err).toMatchObject({
			statusCode: 403,
		});
	});

	it("should reject requests with missing or non-positive x-project-id header with 403 (AUTH_007)", () => {
		req.headers = { "x-project-id": "0" };

		projectScopeMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0];
		expect(err).toMatchObject({
			statusCode: 403,
		});
	});
});
