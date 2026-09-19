import { Prisma, type TreeScanAuditChangeType } from "@prisma/client";
import { logger } from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";
import type { JwtPayload } from "../auth/auth.types";
import {
	DASHBOARD_MESSAGES,
	type ImplementedTreeCountGroupBy,
	type TreeCountGroupBy,
} from "./dashboardWidgets.constants";
import {
	countScanTotals,
	countScansPerBucket,
	countTrees,
	countTreesByGroup,
} from "./dashboardWidgets.queries";
import {
	buildScanConditions,
	resolveDashboardScope,
	scanConditionsToWhere,
	type DashboardScope,
	type ScanConditions,
} from "./dashboardWidgets.scope";
import type {
	DashboardFiltersQuery,
	ScanStatsReqQuery,
	TotalsReqQuery,
	TreeCountsReqQuery,
} from "./dashboardWidgets.schemas";

export interface DashboardContext {
	user: JwtPayload;
	projectScope?: { projectId: number };
}

export interface DashboardTotals {
	scope: DashboardScope["level"];
	projectId: number | null;
	trees: number;
	scans: number;
	archivedScans: number;
	farmers: number;
	inspectors: number;
	species: number;
	batches: number | null;
	projects?: number;
}

export interface TreeCountGroupRow {
	key: number;
	label: string | null;
	trees: number;
}

export interface TreeCountsResult {
	scope: DashboardScope["level"];
	groupBy: TreeCountGroupBy;
	rows: TreeCountGroupRow[];
	total: number;
}

export interface ScanStatsResult {
	scope: DashboardScope["level"];
	scans: number;
	archived: number;
	corrected: number;
	valid: number;
	invalid: number;
	events: Record<TreeScanAuditChangeType, number>;
	series: Array<{ bucket: string; scans: number }>;
}

const EMPTY_EVENTS: Record<TreeScanAuditChangeType, number> = {
	created: 0,
	corrected: 0,
	archived: 0,
	validated: 0,
};

// Rethrow known errors, wrap everything else as a database error (same pattern as tree-scans)
const handleServiceError = (error: unknown, operation: string): never => {
	if (error instanceof AppError) {
		throw error;
	}
	logger.error("Dashboard query failed", {
		operation,
		message: error instanceof Error ? error.message : String(error),
	});
	throw new AppError(500, customError("SYS_002"));
};

const ensureProjectExists = async (projectId: number): Promise<void> => {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true },
	});

	if (!project) {
		throw new AppError(
			404,
			customError("DATA_001"),
			DASHBOARD_MESSAGES.PROJECT_NOT_FOUND,
		);
	}
};

// OrganisationAdmin: project must be owned by, or shared with, the token's organisation
const ensureProjectLinkedToOrganisation = async (
	projectId: number,
	organisationId: number,
): Promise<void> => {
	const project = await prisma.project.findFirst({
		where: {
			id: projectId,
			OR: [
				{ ownerOrganisationId: organisationId },
				{ projectOrganisations: { some: { organisationId } } },
			],
		},
		select: { id: true },
	});

	if (!project) {
		throw new AppError(
			403,
			customError("TENANT_002"),
			DASHBOARD_MESSAGES.PROJECT_NOT_LINKED,
		);
	}
};

// Legacy tokens only: the projectId came from the x-project-id header, so prove membership
// against either the v1.2 junction or the legacy assignment table. Signed project tokens
// skip this (see resolveDashboardScope).
// [AUTH-CLEANUP] Delete once the header fallback is removed from projectScopeMiddleware.
const ensureProjectMembership = async (
	userId: number,
	projectId: number,
): Promise<void> => {
	const [projectRole, legacyAssignment] = await Promise.all([
		prisma.userProjectRole.findFirst({
			where: { userId, projectId },
			select: { userId: true },
		}),
		prisma.userProject.findUnique({
			where: { userId_projectId: { userId, projectId } },
			select: { userId: true },
		}),
	]);

	if (!projectRole && !legacyAssignment) {
		throw new AppError(
			403,
			customError("AUTH_004"),
			DASHBOARD_MESSAGES.NOT_PROJECT_MEMBER,
		);
	}
};

// Resolve human-readable labels for id-keyed groups. Species labels are left null
// until the TreeType display field is confirmed against treeType.prisma.
const resolveLabels = async (
	groupBy: ImplementedTreeCountGroupBy,
	keys: number[],
): Promise<Map<number, string>> => {
	const labels = new Map<number, string>();

	if (keys.length === 0 || groupBy === "year" || groupBy === "species") {
		return labels;
	}

	if (groupBy === "project") {
		const projects = await prisma.project.findMany({
			where: { id: { in: keys } },
			select: { id: true, name: true },
		});
		projects.forEach((project) => labels.set(project.id, project.name));
		return labels;
	}

	const users = await prisma.user.findMany({
		where: { id: { in: keys } },
		select: { id: true, name: true },
	});
	users.forEach((user) => labels.set(user.id, user.name));
	return labels;
};

export class DashboardWidgetsService {
	// Resolve scope, run the async guards, and merge caller filters into query conditions
	private async resolveConditions(
		context: DashboardContext,
		filters: DashboardFiltersQuery,
	): Promise<{ scope: DashboardScope; conditions: ScanConditions }> {
		const scope = resolveDashboardScope(context);
		const conditions = buildScanConditions(scope, filters);

		if (conditions.projectId !== undefined) {
			await ensureProjectExists(conditions.projectId);
		}

		if (scope.checks.organisationLink && scope.projectId !== undefined) {
			await ensureProjectLinkedToOrganisation(
				scope.projectId,
				scope.organisationId ?? -1,
			);
		}

		if (scope.checks.projectMembership && scope.projectId !== undefined) {
			await ensureProjectMembership(scope.userId, scope.projectId);
		}

		return { scope, conditions };
	}

	async getTotals(
		context: DashboardContext,
		query: TotalsReqQuery,
	): Promise<DashboardTotals> {
		try {
			const { scope, conditions } = await this.resolveConditions(
				context,
				query,
			);

			const [trees, scanTotals, batches, projects] = await Promise.all([
				countTrees(conditions),
				countScanTotals(conditions),
				// scan_batches has no farmer column, so a farmer-level batch count is meaningless
				scope.level === "farmer"
					? Promise.resolve(null)
					: prisma.scanBatch.count({
							where: {
								...(conditions.projectId !== undefined
									? { projectId: conditions.projectId }
									: {}),
								...(conditions.inspectorId !== undefined
									? { inspectorId: conditions.inspectorId }
									: {}),
							},
						}),
				scope.level === "global"
					? prisma.project.count({ where: { isActive: true } })
					: Promise.resolve(undefined),
			]);

			return {
				scope: scope.level,
				projectId: conditions.projectId ?? null,
				trees,
				scans: scanTotals.scans,
				archivedScans: scanTotals.archivedScans,
				farmers: scanTotals.farmers,
				inspectors: scanTotals.inspectors,
				species: scanTotals.species,
				batches,
				...(projects !== undefined ? { projects } : {}),
			};
		} catch (error: unknown) {
			return handleServiceError(error, "getTotals");
		}
	}

	async getTreeCounts(
		context: DashboardContext,
		query: TreeCountsReqQuery,
	): Promise<TreeCountsResult> {
		// Farm grouping is reserved until the Farm model lands (owned by another stream).
		if (query.groupBy === "farm") {
			throw new AppError(
				501,
				customError("SYS_006"),
				DASHBOARD_MESSAGES.FARM_GROUPING_NOT_IMPLEMENTED,
			);
		}
		const groupBy: ImplementedTreeCountGroupBy = query.groupBy;

		try {
			const { scope, conditions } = await this.resolveConditions(
				context,
				query,
			);

			const rows = await countTreesByGroup(conditions, groupBy);
			const labels = await resolveLabels(
				groupBy,
				rows.map((row) => row.key),
			);

			return {
				scope: scope.level,
				groupBy,
				rows: rows.map((row) => ({
					key: row.key,
					label: labels.get(row.key) ?? null,
					trees: row.trees,
				})),
				total: await countTrees(conditions),
			};
		} catch (error: unknown) {
			return handleServiceError(error, "getTreeCounts");
		}
	}

	async getScanStats(
		context: DashboardContext,
		query: ScanStatsReqQuery,
	): Promise<ScanStatsResult> {
		try {
			const { scope, conditions } = await this.resolveConditions(
				context,
				query,
			);

			const uploadRange: Prisma.DateTimeFilter = {
				...(query.from ? { gte: query.from } : {}),
				...(query.to ? { lte: query.to } : {}),
			};
			const hasRange = Object.keys(uploadRange).length > 0;

			const scopeWhere = scanConditionsToWhere(conditions);
			const where: Prisma.TreeScanWhereInput = {
				...scopeWhere,
				...(hasRange ? { uploadTimestamp: uploadRange } : {}),
			};

			const [scans, archived, corrected, invalid, events, series] =
				await Promise.all([
					prisma.treeScan.count({ where: { ...where, isArchived: false } }),
					prisma.treeScan.count({ where: { ...where, isArchived: true } }),
					prisma.treeScan.count({
						where: { ...where, isArchived: false, isCorrected: true },
					}),
					prisma.treeScan.count({
						where: { ...where, isArchived: false, isValid: false },
					}),
					prisma.treeScanAudit.groupBy({
						by: ["changeType"],
						where: {
							treeScan: scopeWhere,
							...(hasRange ? { changedAt: uploadRange } : {}),
						},
						_count: { _all: true },
					}),
					countScansPerBucket(conditions, query.bucket, query.from, query.to),
				]);

			const eventCounts = { ...EMPTY_EVENTS };
			events.forEach((event) => {
				eventCounts[event.changeType] = event._count._all;
			});

			return {
				scope: scope.level,
				scans,
				archived,
				corrected,
				valid: scans - invalid,
				invalid,
				events: eventCounts,
				series: series.map((row) => ({
					bucket: row.bucket.toISOString(),
					scans: row.scans,
				})),
			};
		} catch (error: unknown) {
			return handleServiceError(error, "getScanStats");
		}
	}
}

export const dashboardWidgetsService = new DashboardWidgetsService();
