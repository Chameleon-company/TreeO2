import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import { projectScopeMiddleware } from "../../../src/middleware/projectScope.middleware";
import { AppError } from "../../../src/middleware/errorHandler";
import { customError } from "../../../src/utils/errorCodes";
import type {
	IdentityJwtPayload,
	ProjectJwtPayload,
} from "../../../src/modules/auth/auth.types";

describe("projectScopeMiddleware - Comprehensive Unit Tests", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		req = {
			headers: {},
			get: jest.fn(),
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

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
		expect(req.projectScope).toEqual({ projectId: 45 });
	});

	it("should reject Identity-Scoped tokens (without SystemAdmin) with 403 (AUTH_008)", () => {
		const identityUser: IdentityJwtPayload = {
			sub: "123",
			userId: 1,
			scope: "identity",
		};
		req.user = identityUser;

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		const err: unknown = next.mock.calls[0][0];
		if (!(err instanceof AppError)) {
			throw new Error("Expected AppError");
		}
		expect(err.statusCode).toBe(403);
		expect(err.message).toBe(customError("AUTH_008").message);
	});

	it("should allow SystemAdmin Identity tokens to bypass project scope", () => {
		const adminUser: IdentityJwtPayload = {
			sub: "123",
			userId: 123,
			scope: "identity",
			systemRole: "SystemAdmin",
		};

		req.user = adminUser;
		req.params = { project_id: "99" };

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
		expect(req.projectScope).toBeUndefined();
	});

	it("should attach req.projectScope for SystemAdmin if explicitly provided in token or header", () => {
		const adminUser: IdentityJwtPayload = {
			sub: "123",
			userId: 123,
			scope: "identity",
			systemRole: "SystemAdmin",
		};

		req.user = adminUser;
		req.headers = { "x-project-id": "88" };

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
		expect(req.projectScope).toEqual({ projectId: 88 });
	});

	it("should reject unauthenticated requests (req.user undefined) with 401 (AUTH_003)", () => {
		req.user = undefined;

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		const err: unknown = next.mock.calls[0][0];
		if (!(err instanceof AppError)) {
			throw new Error("Expected AppError");
		}
		expect(err.statusCode).toBe(401);
		expect(err.message).toBe(customError("AUTH_003").message);
	});

	it("should reject tokens with missing or non-positive projectId with 403 (AUTH_007)", () => {
		const invalidProjectUser = {
			sub: "123",
			userId: 123,
			scope: "project" as const,
			projectId: 0,
			organisationId: 10,
			organisationRole: "Member",
			projectRoles: ["Inspector"],
		};

		req.user = invalidProjectUser;

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		const err: unknown = next.mock.calls[0][0];
		if (!(err instanceof AppError)) {
			throw new Error("Expected AppError");
		}
		expect(err.statusCode).toBe(403);
		expect(err.message).toBe(customError("AUTH_007").message);
	});

	it("should ignore client x-project-id HTTP header and strictly use token claims", () => {
		const identityUser: IdentityJwtPayload = {
			sub: "123",
			userId: 123,
			scope: "identity",
		};

		req.user = identityUser;
		req.headers = { "x-project-id": "999" };

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		const err: unknown = next.mock.calls[0][0];
		if (!(err instanceof AppError)) {
			throw new Error("Expected AppError");
		}
		expect(err.statusCode).toBe(403);
		expect(req.projectScope).toBeUndefined();
	});
});
