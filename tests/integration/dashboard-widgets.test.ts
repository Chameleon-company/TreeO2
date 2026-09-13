import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { prisma } from "../../src/lib/prisma";
import { AppError } from "../../src/middleware/errorHandler";
import type { JwtPayload } from "../../src/modules/auth/auth.types";
import {
	buildScanConditions,
	resolveDashboardScope,
	scanConditionsToSql,
	scanConditionsToWhere,
} from "../../src/modules/dashboard-widgets/dashboardWidgets.scope";
import * as queries from "../../src/modules/dashboard-widgets/dashboardWidgets.queries";
import { dashboardWidgetsService } from "../../src/modules/dashboard-widgets/dashboardWidgets.service";

jest.mock("../../src/lib/prisma", () => ({
	prisma: {
		project: {
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			findMany: jest.fn(),
			count: jest.fn(),
		},
		user: {
			findMany: jest.fn(),
		},
		userProjectRole: {
			findFirst: jest.fn(),
		},
		userProject: {
			findUnique: jest.fn(),
		},
		scanBatch: {
			count: jest.fn(),
		},
		treeScan: {
			count: jest.fn(),
		},
		treeScanAudit: {
			groupBy: jest.fn(),
		},
	},
}));

jest.mock(
	"../../src/modules/dashboard-widgets/dashboardWidgets.queries",
	() => ({
		latestScanPerFobYearSql: jest.fn(),
		countTrees: jest.fn(),
		countTreesByGroup: jest.fn(),
		countScanTotals: jest.fn(),
		countScansPerBucket: jest.fn(),
	}),
);

const mockedProject = prisma.project as {
	findUnique: jest.MockedFunction<any>;
	findFirst: jest.MockedFunction<any>;
	findMany: jest.MockedFunction<any>;
	count: jest.MockedFunction<any>;
};
const mockedUser = prisma.user as { findMany: jest.MockedFunction<any> };
const mockedUserProjectRole = prisma.userProjectRole as {
	findFirst: jest.MockedFunction<any>;
};
const mockedUserProject = prisma.userProject as {
	findUnique: jest.MockedFunction<any>;
};
const mockedScanBatch = prisma.scanBatch as { count: jest.MockedFunction<any> };
const mockedTreeScan = prisma.treeScan as { count: jest.MockedFunction<any> };
const mockedTreeScanAudit = prisma.treeScanAudit as {
	groupBy: jest.MockedFunction<any>;
};

const mockedQueries = queries as {
	countTrees: jest.MockedFunction<any>;
	countTreesByGroup: jest.MockedFunction<any>;
	countScanTotals: jest.MockedFunction<any>;
	countScansPerBucket: jest.MockedFunction<any>;
};

// ---- token fixtures (mirror the dev tokens in auth.middleware.ts) ----

const systemAdminIdentity: JwtPayload = {
	scope: "identity",
	sub: "1",
	userId: 1,
	systemRole: "SystemAdmin",
	organisations: [],
	jti: "j",
	iat: 0,
	exp: 0,
};

const projectToken = (
	overrides: Partial<Extract<JwtPayload, { scope: "project" }>> = {},
): JwtPayload => ({
	scope: "project",
	sub: "3",
	userId: 3,
	projectId: 1,
	organisationId: 1,
	organisationRole: "Member",
	projectRoles: ["Manager"],
	jti: "j",
	iat: 0,
	exp: 0,
	...overrides,
});

const legacyToken = (role: "ADMIN" | "MANAGER" | "INSPECTOR" | "FARMER") =>
	({ id: 9, role }) as JwtPayload;

const scope1 = { projectId: 1 };

const expectAppError = async (
	promise: Promise<unknown>,
	statusCode: number,
	code?: string,
): Promise<void> => {
	await expect(promise).rejects.toThrow(AppError);
	await promise.catch((error: unknown) => {
		expect(error).toBeInstanceOf(AppError);
		expect((error as AppError).statusCode).toBe(statusCode);
		if (code) {
			expect((error as AppError).code).toBe(code);
		}
	});
};

describe("Dashboard scope resolution - Unit Tests", () => {
	describe("resolveDashboardScope", () => {
		it("SystemAdmin without project scope resolves to global", () => {
			const scope = resolveDashboardScope({ user: systemAdminIdentity });

			expect(scope.level).toBe("global");
			expect(scope.projectId).toBeUndefined();
			expect(scope.checks).toEqual({
				organisationLink: false,
				projectMembership: false,
			});
		});

		it("SystemAdmin with project scope resolves to project without guards", () => {
			const scope = resolveDashboardScope({
				user: systemAdminIdentity,
				projectScope: scope1,
			});

			expect(scope.level).toBe("project");
			expect(scope.projectId).toBe(1);
			expect(scope.checks.projectMembership).toBe(false);
		});

		it("OrganisationAdmin resolves to project with organisation-link guard", () => {
			const scope = resolveDashboardScope({
				user: projectToken({
					userId: 6,
					organisationRole: "OrganisationAdmin",
					projectRoles: [],
				}),
				projectScope: scope1,
			});

			expect(scope.level).toBe("project");
			expect(scope.organisationId).toBe(1);
			expect(scope.checks).toEqual({
				organisationLink: true,
				projectMembership: false,
			});
		});

		it("Manager with a signed project token needs no membership guard", () => {
			const scope = resolveDashboardScope({
				user: projectToken(),
				projectScope: scope1,
			});

			expect(scope.level).toBe("project");
			expect(scope.checks.projectMembership).toBe(false);
		});

		it("legacy Manager relying on the x-project-id header gets the membership guard", () => {
			const scope = resolveDashboardScope({
				user: legacyToken("MANAGER"),
				projectScope: scope1,
			});

			expect(scope.level).toBe("project");
			expect(scope.checks.projectMembership).toBe(true);
		});

		it("a project token used for a different project than it names gets the membership guard", () => {
			const scope = resolveDashboardScope({
				user: projectToken({ projectId: 2 }),
				projectScope: scope1,
			});

			expect(scope.checks.projectMembership).toBe(true);
		});

		it("Inspector resolves to inspector level", () => {
			const scope = resolveDashboardScope({
				user: projectToken({ userId: 4, projectRoles: ["Inspector"] }),
				projectScope: scope1,
			});

			expect(scope.level).toBe("inspector");
			expect(scope.userId).toBe(4);
		});

		it("Farmer resolves to farmer level", () => {
			const scope = resolveDashboardScope({
				user: projectToken({ userId: 2, projectRoles: ["Farmer"] }),
				projectScope: scope1,
			});

			expect(scope.level).toBe("farmer");
		});

		it("multiple roles are additive - Inspector + Manager gives project level", () => {
			const scope = resolveDashboardScope({
				user: projectToken({ projectRoles: ["Inspector", "Manager"] }),
				projectScope: scope1,
			});

			expect(scope.level).toBe("project");
		});

		it("Developer alone has no dashboard scope (403)", () => {
			expect(() =>
				resolveDashboardScope({
					user: projectToken({ userId: 5, projectRoles: ["Developer"] }),
					projectScope: scope1,
				}),
			).toThrow(AppError);
		});

		it("non-admin without project scope is rejected with AUTH_007", () => {
			try {
				resolveDashboardScope({ user: projectToken() });
				throw new Error("expected AppError");
			} catch (error: unknown) {
				expect((error as AppError).statusCode).toBe(403);
				expect((error as AppError).code).toBe("AUTH_007");
			}
		});

		it("legacy ADMIN token behaves like SystemAdmin", () => {
			const scope = resolveDashboardScope({ user: legacyToken("ADMIN") });

			expect(scope.level).toBe("global");
			expect(scope.userId).toBe(9);
		});

		it("legacy MANAGER / INSPECTOR / FARMER map to their v1.3 levels", () => {
			expect(
				resolveDashboardScope({
					user: legacyToken("MANAGER"),
					projectScope: scope1,
				}).level,
			).toBe("project");
			expect(
				resolveDashboardScope({
					user: legacyToken("INSPECTOR"),
					projectScope: scope1,
				}).level,
			).toBe("inspector");
			expect(
				resolveDashboardScope({
					user: legacyToken("FARMER"),
					projectScope: scope1,
				}).level,
			).toBe("farmer");
		});

		it("falls back to sub when userId and id are absent", () => {
			const scope = resolveDashboardScope({
				user: { sub: "42", role: "MANAGER" } as JwtPayload,
				projectScope: scope1,
			});

			expect(scope.userId).toBe(42);
		});

		it("rejects a payload with no resolvable user id (401)", () => {
			try {
				resolveDashboardScope({
					user: { role: "MANAGER" } as JwtPayload,
					projectScope: scope1,
				});
				throw new Error("expected AppError");
			} catch (error: unknown) {
				expect((error as AppError).statusCode).toBe(401);
			}
		});
	});

	describe("buildScanConditions", () => {
		it("global scope honours a projectId filter", () => {
			const scope = resolveDashboardScope({ user: systemAdminIdentity });

			const conditions = buildScanConditions(scope, {
				projectId: 7,
				year: 2024,
			});

			expect(conditions).toEqual({ projectId: 7, year: 2024 });
		});

		it("project scope with matching projectId filter is accepted", () => {
			const scope = resolveDashboardScope({
				user: projectToken(),
				projectScope: scope1,
			});

			expect(buildScanConditions(scope, { projectId: 1 }).projectId).toBe(1);
		});

		it("project scope with a different projectId filter is rejected (403)", () => {
			const scope = resolveDashboardScope({
				user: projectToken(),
				projectScope: scope1,
			});

			expect(() => buildScanConditions(scope, { projectId: 2 })).toThrow(
				AppError,
			);
		});

		it("inspector scope pins inspectorId to the caller", () => {
			const scope = resolveDashboardScope({
				user: projectToken({ userId: 4, projectRoles: ["Inspector"] }),
				projectScope: scope1,
			});

			expect(buildScanConditions(scope, {})).toEqual({
				projectId: 1,
				inspectorId: 4,
			});
		});

		it("farmer scope pins farmerId to the caller", () => {
			const scope = resolveDashboardScope({
				user: projectToken({ userId: 2, projectRoles: ["Farmer"] }),
				projectScope: scope1,
			});

			expect(buildScanConditions(scope, { speciesId: 3 })).toEqual({
				projectId: 1,
				farmerId: 2,
				speciesId: 3,
			});
		});
	});

	describe("condition builders", () => {
		it("scanConditionsToWhere maps every condition to its Prisma field", () => {
			expect(
				scanConditionsToWhere({
					projectId: 1,
					inspectorId: 4,
					farmerId: 2,
					year: 2023,
					speciesId: 5,
				}),
			).toEqual({
				projectId: 1,
				inspectorId: 4,
				farmerId: 2,
				estimatedPlantedYear: 2023,
				speciesId: 5,
			});
		});

		it("scanConditionsToWhere returns an empty object for global scope", () => {
			expect(scanConditionsToWhere({})).toEqual({});
		});

		it("scanConditionsToSql binds values as parameters, never inlines them", () => {
			const sql = scanConditionsToSql({ projectId: 1, farmerId: 2 });

			expect(sql.values).toEqual([1, 2]);
			expect(sql.sql).toContain("ts.project_id = ");
			expect(sql.sql).toContain("ts.farmer_id = ");
			expect(sql.sql).not.toContain("1");
		});

		it("scanConditionsToSql returns TRUE when there are no conditions", () => {
			expect(scanConditionsToSql({}).sql.trim()).toBe("TRUE");
		});
	});
});

describe("DashboardWidgetsService - Unit Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedProject.findUnique.mockResolvedValue({ id: 1 });
		mockedProject.findFirst.mockResolvedValue({ id: 1 });
		mockedUserProjectRole.findFirst.mockResolvedValue({ userId: 3 });
		mockedUserProject.findUnique.mockResolvedValue(null);
		mockedQueries.countTrees.mockResolvedValue(10);
		mockedQueries.countScanTotals.mockResolvedValue({
			scans: 25,
			archivedScans: 2,
			farmers: 4,
			inspectors: 1,
			species: 2,
		});
		mockedScanBatch.count.mockResolvedValue(3);
		mockedProject.count.mockResolvedValue(5);
	});

	describe("guards", () => {
		it("throws 404 when the scoped project does not exist", async () => {
			mockedProject.findUnique.mockResolvedValue(null);

			await expectAppError(
				dashboardWidgetsService.getTotals(
					{ user: projectToken(), projectScope: scope1 },
					{},
				),
				404,
				"DATA_001",
			);
		});

		it("OrganisationAdmin is rejected with TENANT_002 when the project is not linked", async () => {
			mockedProject.findFirst.mockResolvedValue(null);

			await expectAppError(
				dashboardWidgetsService.getTotals(
					{
						user: projectToken({
							userId: 6,
							organisationRole: "OrganisationAdmin",
							projectRoles: [],
						}),
						projectScope: scope1,
					},
					{},
				),
				403,
				"TENANT_002",
			);
			expect(mockedProject.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({ id: 1 }),
				}),
			);
		});

		it("legacy Manager without a project assignment in either table is rejected (403)", async () => {
			mockedUserProjectRole.findFirst.mockResolvedValue(null);
			mockedUserProject.findUnique.mockResolvedValue(null);

			await expectAppError(
				dashboardWidgetsService.getTotals(
					{ user: legacyToken("MANAGER"), projectScope: scope1 },
					{},
				),
				403,
				"AUTH_004",
			);
			expect(mockedQueries.countTrees).not.toHaveBeenCalled();
		});

		it("legacy Manager assigned only via the legacy user_projects table is accepted", async () => {
			mockedUserProjectRole.findFirst.mockResolvedValue(null);
			mockedUserProject.findUnique.mockResolvedValue({ userId: 9 });

			const result = await dashboardWidgetsService.getTotals(
				{ user: legacyToken("MANAGER"), projectScope: scope1 },
				{},
			);

			expect(result.scope).toBe("project");
		});

		it("signed project token skips the membership lookup entirely", async () => {
			await dashboardWidgetsService.getTotals(
				{ user: projectToken(), projectScope: scope1 },
				{},
			);

			expect(mockedUserProjectRole.findFirst).not.toHaveBeenCalled();
			expect(mockedUserProject.findUnique).not.toHaveBeenCalled();
		});

		it("SystemAdmin skips membership and organisation guards", async () => {
			await dashboardWidgetsService.getTotals({ user: systemAdminIdentity }, {});

			expect(mockedUserProjectRole.findFirst).not.toHaveBeenCalled();
			expect(mockedProject.findFirst).not.toHaveBeenCalled();
		});

		it("wraps unexpected database failures as 500 SYS_002", async () => {
			mockedQueries.countTrees.mockRejectedValue(new Error("boom"));

			await expectAppError(
				dashboardWidgetsService.getTotals({ user: systemAdminIdentity }, {}),
				500,
				"SYS_002",
			);
		});
	});

	describe("getTotals", () => {
		it("returns global totals including active project count", async () => {
			const result = await dashboardWidgetsService.getTotals(
				{ user: systemAdminIdentity },
				{},
			);

			expect(result).toMatchObject({
				scope: "global",
				projectId: null,
				trees: 10,
				scans: 25,
				archivedScans: 2,
				farmers: 4,
				inspectors: 1,
				species: 2,
				batches: 3,
				projects: 5,
			});
			expect(mockedQueries.countTrees).toHaveBeenCalledWith({});
		});

		it("returns project totals without the projects field", async () => {
			const result = await dashboardWidgetsService.getTotals(
				{ user: projectToken(), projectScope: scope1 },
				{ year: 2023 },
			);

			expect(result.projectId).toBe(1);
			expect(result).not.toHaveProperty("projects");
			expect(mockedQueries.countTrees).toHaveBeenCalledWith({
				projectId: 1,
				year: 2023,
			});
			expect(mockedScanBatch.count).toHaveBeenCalledWith({
				where: { projectId: 1 },
			});
		});

		it("inspector totals scope batches to the caller", async () => {
			await dashboardWidgetsService.getTotals(
				{
					user: projectToken({ userId: 4, projectRoles: ["Inspector"] }),
					projectScope: scope1,
				},
				{},
			);

			expect(mockedScanBatch.count).toHaveBeenCalledWith({
				where: { projectId: 1, inspectorId: 4 },
			});
		});

		it("farmer totals report batches as null", async () => {
			const result = await dashboardWidgetsService.getTotals(
				{
					user: projectToken({ userId: 2, projectRoles: ["Farmer"] }),
					projectScope: scope1,
				},
				{},
			);

			expect(result.batches).toBeNull();
			expect(mockedScanBatch.count).not.toHaveBeenCalled();
			expect(mockedQueries.countTrees).toHaveBeenCalledWith({
				projectId: 1,
				farmerId: 2,
			});
		});
	});

	describe("getTreeCounts", () => {
		it("groupBy=farm returns 501 SYS_006 before touching the database", async () => {
			await expectAppError(
				dashboardWidgetsService.getTreeCounts(
					{ user: systemAdminIdentity },
					{ groupBy: "farm" },
				),
				501,
				"SYS_006",
			);
			expect(mockedProject.findUnique).not.toHaveBeenCalled();
			expect(mockedQueries.countTreesByGroup).not.toHaveBeenCalled();
		});

		it("groups by year with no labels", async () => {
			mockedQueries.countTreesByGroup.mockResolvedValue([
				{ key: 2023, trees: 6 },
				{ key: 2024, trees: 4 },
			]);

			const result = await dashboardWidgetsService.getTreeCounts(
				{ user: projectToken(), projectScope: scope1 },
				{ groupBy: "year" },
			);

			expect(result.groupBy).toBe("year");
			expect(result.rows).toEqual([
				{ key: 2023, label: null, trees: 6 },
				{ key: 2024, label: null, trees: 4 },
			]);
			expect(result.total).toBe(10);
			expect(mockedProject.findMany).not.toHaveBeenCalled();
		});

		it("groups by project and resolves project names as labels", async () => {
			mockedQueries.countTreesByGroup.mockResolvedValue([
				{ key: 1, trees: 7 },
				{ key: 2, trees: 3 },
			]);
			mockedProject.findMany.mockResolvedValue([
				{ id: 1, name: "Rai Matak North" },
				{ id: 2, name: "Rai Matak South" },
			]);

			const result = await dashboardWidgetsService.getTreeCounts(
				{ user: systemAdminIdentity },
				{ groupBy: "project" },
			);

			expect(result.rows[0]).toEqual({
				key: 1,
				label: "Rai Matak North",
				trees: 7,
			});
			expect(mockedProject.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: { in: [1, 2] } } }),
			);
		});

		it("groups by inspector and resolves user names as labels", async () => {
			mockedQueries.countTreesByGroup.mockResolvedValue([{ key: 4, trees: 10 }]);
			mockedUser.findMany.mockResolvedValue([{ id: 4, name: "Maria Soares" }]);

			const result = await dashboardWidgetsService.getTreeCounts(
				{ user: projectToken(), projectScope: scope1 },
				{ groupBy: "inspector" },
			);

			expect(result.rows[0].label).toBe("Maria Soares");
		});
	});

	describe("getScanStats", () => {
		beforeEach(() => {
			mockedTreeScan.count
				.mockResolvedValueOnce(20) // scans (non-archived)
				.mockResolvedValueOnce(3) // archived
				.mockResolvedValueOnce(2) // corrected
				.mockResolvedValueOnce(1); // invalid
			mockedTreeScanAudit.groupBy.mockResolvedValue([
				{ changeType: "corrected", _count: { _all: 2 } },
				{ changeType: "archived", _count: { _all: 3 } },
			]);
			mockedQueries.countScansPerBucket.mockResolvedValue([
				{ bucket: new Date("2026-01-01T00:00:00.000Z"), scans: 12 },
				{ bucket: new Date("2026-02-01T00:00:00.000Z"), scans: 8 },
			]);
		});

		it("returns counts, derived valid count, event counts and series", async () => {
			const result = await dashboardWidgetsService.getScanStats(
				{ user: projectToken(), projectScope: scope1 },
				{ bucket: "month" },
			);

			expect(result).toMatchObject({
				scope: "project",
				scans: 20,
				archived: 3,
				corrected: 2,
				invalid: 1,
				valid: 19,
				events: { created: 0, corrected: 2, archived: 3, validated: 0 },
			});
			expect(result.series).toEqual([
				{ bucket: "2026-01-01T00:00:00.000Z", scans: 12 },
				{ bucket: "2026-02-01T00:00:00.000Z", scans: 8 },
			]);
		});

		it("applies the upload date range to scan counts and audit events", async () => {
			const from = new Date("2026-01-01T00:00:00.000Z");
			const to = new Date("2026-03-31T00:00:00.000Z");

			await dashboardWidgetsService.getScanStats(
				{ user: projectToken(), projectScope: scope1 },
				{ bucket: "year", from, to },
			);

			expect(mockedTreeScan.count).toHaveBeenCalledWith({
				where: {
					projectId: 1,
					uploadTimestamp: { gte: from, lte: to },
					isArchived: false,
				},
			});
			expect(mockedTreeScanAudit.groupBy).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { treeScan: { projectId: 1 }, changedAt: { gte: from, lte: to } },
				}),
			);
			expect(mockedQueries.countScansPerBucket).toHaveBeenCalledWith(
				{ projectId: 1 },
				"year",
				from,
				to,
			);
		});

		it("inspector scope restricts audit events to the caller's scans", async () => {
			await dashboardWidgetsService.getScanStats(
				{
					user: projectToken({ userId: 4, projectRoles: ["Inspector"] }),
					projectScope: scope1,
				},
				{ bucket: "month" },
			);

			expect(mockedTreeScanAudit.groupBy).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { treeScan: { projectId: 1, inspectorId: 4 } },
				}),
			);
		});
	});
});