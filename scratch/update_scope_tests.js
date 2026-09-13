const fs = require('fs');
const file = 'tests/unit/middleware/projectScope.middleware.test.ts';
let content = fs.readFileSync(file, 'utf8');

// Task 1: Add comment to SystemAdmin bypass test
content = content.replace(
	'	it("should allow SystemAdmin Identity tokens to bypass project scope", () => {',
	'	// [AUTH-CLEANUP] Note: This bypass is a temporary migration workaround until the select-project endpoint is live.\n\tit("should allow SystemAdmin Identity tokens to bypass project scope", () => {'
);

// Task 2: Update "Token vs Header" test
const originalHeaderTest = `	it("should attach req.projectScope for SystemAdmin if explicitly provided in token or header", () => {
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
	});`;

const newHeaderTest = `	it("should attach req.projectScope for SystemAdmin if explicitly provided in header", () => {
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

	it("should attach req.projectScope for SystemAdmin if explicitly provided in token", () => {
		const adminUser = {
			sub: "123",
			userId: 123,
			scope: "project",
			systemRole: "SystemAdmin",
			projectId: 88,
		};

		req.user = adminUser as any;
		req.headers = {};

		projectScopeMiddleware(
			req as unknown as Request,
			res as unknown as Response,
			next,
		);

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith();
		expect(req.projectScope).toEqual({ projectId: 88 });
	});`;

content = content.replace(originalHeaderTest, newHeaderTest);


// Task 3: Split "missing or non-positive projectId"
const originalMissingTest = `	it("should reject tokens with missing or non-positive projectId with 403 (AUTH_007)", () => {
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
	});`;

const newMissingTest = `	it("should reject tokens with non-positive projectId with 403 (AUTH_007)", () => {
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

	it("should reject tokens with missing projectId with 403 (AUTH_007)", () => {
		const missingProjectUser = {
			sub: "123",
			userId: 123,
			scope: "project" as const,
			organisationId: 10,
			organisationRole: "Member",
			projectRoles: ["Inspector"],
		};

		req.user = missingProjectUser as any;

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
	});`;

content = content.replace(originalMissingTest, newMissingTest);

fs.writeFileSync(file, content);
