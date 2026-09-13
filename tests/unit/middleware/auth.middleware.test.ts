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

	});
