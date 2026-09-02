import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import { requirePermission } from "../../../src/middleware/capability.middleware";
import { AppError } from "../../../src/middleware/errorHandler";
import { customError } from "../../../src/utils/errorCodes";
import type {
	IdentityJwtPayload,
	ProjectJwtPayload,
} from "../../../src/modules/auth/auth.types";

const MOCK_MATRIX: Record<string, readonly string[]> = {
	Manager: ["reports:create", "tree_scans:read"],
	Inspector: ["tree_scans:create"],
	Farmer: ["tree_scans:read"],
};

const MOCK_LEGACY_MATRIX: Record<string, readonly string[]> = {
	ADMIN: ["projects:create"],
	DEVELOPER: ["localization:read"],
};

describe("requirePermission - Comprehensive Unit Tests (AUTH03 & AUTH04)", () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		req = {
			headers: {},
		};
		res = {};
		next = jest.fn();
	});

	describe("AUTH04 Rule 1: SystemAdmin Unrestricted Override", () => {
		it("should allow SystemAdmin unrestricted access for any capability key", () => {
			const systemAdminUser: IdentityJwtPayload = {
				sub: "1",
				userId: 1,
				scope: "identity",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				organisations: [],
				systemRole: "SystemAdmin",
			};

			req.user = systemAdminUser;

			const middleware = requirePermission(
				"tree_scans:delete",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});
	});

	describe("AUTH04 Rule 2: OrganisationAdmin Implicit Access Override", () => {
		it("should allow OrganisationAdmin implicit project access even with empty projectRoles", () => {
			const orgAdminUser: ProjectJwtPayload = {
				sub: "6",
				userId: 6,
				scope: "project",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				projectId: 1,
				organisationId: 1,
				organisationRole: "OrganisationAdmin",
				projectRoles: [],
			};

			req.user = orgAdminUser;

			const middleware = requirePermission(
				"reports:create",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});
	});

	describe("AUTH03: Fine-Grained Capability Evaluation (Table 7)", () => {
		it("should allow Manager to read tree scans and create reports", () => {
			const managerUser: ProjectJwtPayload = {
				sub: "3",
				userId: 3,
				scope: "project",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				projectId: 1,
				organisationId: 1,
				organisationRole: "Member",
				projectRoles: ["Manager"],
			};

			req.user = managerUser;

			const middleware = requirePermission(
				"reports:create",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});

		it("should allow Inspector to create tree scans", () => {
			const inspectorUser: ProjectJwtPayload = {
				sub: "4",
				userId: 4,
				scope: "project",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				projectId: 1,
				organisationId: 1,
				organisationRole: "Member",
				projectRoles: ["Inspector"],
			};

			req.user = inspectorUser;

			const middleware = requirePermission(
				"tree_scans:create",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});

		it("should aggregate permissions across multi-role projectRoles array", () => {
			const multiRoleUser: ProjectJwtPayload = {
				sub: "8",
				userId: 8,
				scope: "project",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				projectId: 1,
				organisationId: 1,
				organisationRole: "Member",
				projectRoles: ["Farmer", "Inspector"],
			};

			req.user = multiRoleUser;

			const middleware = requirePermission(
				"tree_scans:create",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});

		it("should reject Inspector from creating reports with 403 (AUTH_004)", () => {
			const inspectorUser: ProjectJwtPayload = {
				sub: "4",
				userId: 4,
				scope: "project",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				projectId: 1,
				organisationId: 1,
				organisationRole: "Member",
				projectRoles: ["Inspector"],
			};

			req.user = inspectorUser;

			const middleware = requirePermission(
				"reports:create",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			const err: unknown = next.mock.calls[0][0];
			if (!(err instanceof AppError)) {
				throw new Error("Expected AppError");
			}
			expect(err.statusCode).toBe(403);
			expect(err.message).toBe(customError("AUTH_004").message);
		});

		it("should reject Farmer from creating tree scans with 403 (AUTH_004)", () => {
			const farmerUser: ProjectJwtPayload = {
				sub: "2",
				userId: 2,
				scope: "project",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				projectId: 1,
				organisationId: 1,
				organisationRole: "Member",
				projectRoles: ["Farmer"],
			};

			req.user = farmerUser;

			const middleware = requirePermission(
				"tree_scans:create",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			const err: unknown = next.mock.calls[0][0];
			if (!(err instanceof AppError)) {
				throw new Error("Expected AppError");
			}
			expect(err.statusCode).toBe(403);
			expect(err.message).toBe(customError("AUTH_004").message);
		});
	});

	describe("Unauthenticated & Legacy Fallback Scenarios", () => {
		it("should reject unauthenticated requests (req.user undefined) with 401 (AUTH_003)", () => {
			req.user = undefined;

			const middleware = requirePermission(
				"tree_scans:read",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			const err: unknown = next.mock.calls[0][0];
			if (!(err instanceof AppError)) {
				throw new Error("Expected AppError");
			}
			expect(err.statusCode).toBe(401);
			expect(err.message).toBe(customError("AUTH_003").message);
		});

		// [AUTH-CLEANUP] Note: These legacy tests should be removed when the legacy role string fallback is deleted from the middleware.
		it("should allow legacy ADMIN role string via backwards compatibility fallback", () => {
			req.user = {
				sub: "1",
				userId: 1,
				scope: "identity",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				organisations: [],
				role: "ADMIN",
			};

			const middleware = requirePermission(
				"projects:create",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});

		it("should allow legacy DEVELOPER role string via case-insensitive fallback", () => {
			req.user = {
				sub: "5",
				userId: 5,
				scope: "identity",
				jti: "test-jti",
				iat: 123456789,
				exp: 987654321,
				organisations: [],
				role: "DEVELOPER",
			};

			const middleware = requirePermission(
				"localization:read",
				MOCK_MATRIX,
				MOCK_LEGACY_MATRIX,
			);
			middleware(req as unknown as Request, res as unknown as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});
	});
});
