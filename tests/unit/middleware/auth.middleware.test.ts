import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../../../src/middleware/auth.middleware";
describe("authMiddleware - Comprehensive Unit Tests", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: jest.MockedFunction<NextFunction>;
	const secretKey =
		process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

	beforeEach(() => {
		req = {
			headers: {},
		};
		res = {};
		next = jest.fn();
	});

	it("should attach req.user and call next() for a valid signed JWT", () => {
		const payload = {
			sub: "123",
			userId: 123,
			scope: "project" as const,
			projectId: 45,
			systemRole: null,
			organisationId: 10,
			organisationRole: "Member",
			projectRoles: ["Manager"],
		};

		const token = jwt.sign(payload, secretKey);
		req.headers = { authorization: `Bearer ${token}` };

		authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
		expect(req.user).toHaveProperty("userId", 123);
		expect(req.user).toHaveProperty("scope", "project");
	});

	it("should pass AppError(401, AUTH_003) when Authorization header is missing", () => {
		req.headers = {};

		authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0];
		expect(err).toMatchObject({
			statusCode: 401,
		});
	});

	it("should pass AppError(401, AUTH_003) when Authorization header is not Bearer format", () => {
		req.headers = { authorization: "Basic dXNlcjpwYXNz" };

		authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0];
		expect(err).toMatchObject({
			statusCode: 401,
		});
	});

	it("should pass AppError(401, AUTH_005) when JWT signature is invalid", () => {
		const token = jwt.sign(
			{ sub: "123", userId: 123, scope: "identity" },
			"wrong-secret-key-32-chars-long",
		);
		req.headers = { authorization: `Bearer ${token}` };

		authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0];
		expect(err).toMatchObject({
			statusCode: 401,
		});
	});

	it("should pass AppError(401, AUTH_005) when JWT token is expired", () => {
		const token = jwt.sign(
			{ sub: "123", userId: 123, scope: "identity" },
			secretKey,
			{ expiresIn: "-1s" },
		);
		req.headers = { authorization: `Bearer ${token}` };

		authMiddleware(req as Request, res as Response, next);

		expect(next).toHaveBeenCalledTimes(1);
		const [err] = next.mock.calls[0];
		expect(err).toMatchObject({
			statusCode: 401,
		});
	});

	describe("Development Bypass Tokens (AUTH_DEV_MODE=true)", () => {
		let originalNodeEnv: string;
		let originalDevMode: boolean;
		// Dynamically require env so we can mutate the evaluated singleton
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { env } = require("../../../src/config/env");

		beforeEach(() => {
			originalNodeEnv = env.NODE_ENV;
			originalDevMode = env.AUTH_DEV_MODE;
			env.NODE_ENV = "development";
			env.AUTH_DEV_MODE = true;
		});

		afterEach(() => {
			env.NODE_ENV = originalNodeEnv;
			env.AUTH_DEV_MODE = originalDevMode;
		});

		it("should reject dev-bypass tokens with 401 AUTH_005 when NODE_ENV is not development", () => {
			env.NODE_ENV = "production"; // Explicitly test production rejection
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_ADMIN_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			const [err] = next.mock.calls[0];
			expect(err).toMatchObject({
				statusCode: 401,
			});
		});

		it("should assign spec-compliant Identity payload for dev-admin-token", () => {
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_ADMIN_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.user).toEqual({
				sub: "1",
				userId: 1,
				scope: "identity",
				systemRole: "SystemAdmin",
				role: "ADMIN",
			});
		});

		it("should assign spec-compliant Project payload for dev-manager-token", () => {
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_MANAGER_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.user).toHaveProperty("scope", "project");
			expect(req.user).toHaveProperty("projectId", 1);
			expect(req.user).toHaveProperty("projectRoles", ["Manager"]);
		});

		it("should assign spec-compliant Project payload for dev-inspector-token", () => {
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_INSPECTOR_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.user).toHaveProperty("scope", "project");
			expect(req.user).toHaveProperty("projectRoles", ["Inspector"]);
		});

		it("should assign spec-compliant Project payload for dev-farmer-token", () => {
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_FARMER_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.user).toHaveProperty("scope", "project");
			expect(req.user).toHaveProperty("projectRoles", ["Farmer"]);
		});

		it("should assign spec-compliant Project payload for dev-developer-token", () => {
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_DEVELOPER_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.user).toHaveProperty("scope", "project");
			expect(req.user).toHaveProperty("projectRoles", ["Developer"]);
		});

		it("should assign spec-compliant OrganisationAdmin payload for dev-org-admin-token", () => {
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_ORG_ADMIN_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.user).toHaveProperty("scope", "project");
			expect(req.user).toHaveProperty("organisationRole", "OrganisationAdmin");
		});

		it("should assign spec-compliant SupportAdmin payload for dev-support-admin-token", () => {
			req.headers = {
				authorization: `Bearer ${process.env.AUTH_DEV_SUPPORT_ADMIN_TOKEN}`,
			};

			authMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.user).toHaveProperty("scope", "identity");
			expect(req.user).toHaveProperty("systemRole", "SupportAdmin");
		});
	});
});
