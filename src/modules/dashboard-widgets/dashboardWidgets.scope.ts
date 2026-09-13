import { Prisma } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";
import type { JwtPayload } from "../auth/auth.types";
import { DASHBOARD_MESSAGES } from "./dashboardWidgets.constants";
import type { DashboardFiltersQuery } from "./dashboardWidgets.schemas";

/**
 * Data-scope levels, most permissive first.
 * - global:    every project (SystemAdmin without a selected project)
 * - project:   one project, all scans (SystemAdmin with scope, OrganisationAdmin, Manager)
 * - inspector: one project, scans the caller uploaded
 * - farmer:    one project, scans of trees the caller owns
 */
export type DashboardScopeLevel = "global" | "project" | "inspector" | "farmer";

export interface DashboardScope {
	level: DashboardScopeLevel;
	userId: number;
	projectId?: number;
	organisationId?: number;
	// async guards the service must run before querying (middleware trusts the token/header)
	checks: {
		organisationLink: boolean;
		projectMembership: boolean;
	};
}

export interface ResolveScopeInput {
	user: JwtPayload;
	projectScope?: { projectId: number };
}

// Conditions on tree_scans shared by the Prisma and raw-SQL query builders
export interface ScanConditions {
	projectId?: number;
	inspectorId?: number;
	farmerId?: number;
	year?: number;
	speciesId?: number;
}

const SYSTEM_ADMIN = "SystemAdmin";
const ORGANISATION_ADMIN = "OrganisationAdmin";
const LEGACY_ADMIN = "ADMIN";
const MANAGER = "MANAGER";
const INSPECTOR = "INSPECTOR";
const FARMER = "FARMER";

const readInt = (value: unknown): number | undefined =>
	typeof value === "number" && Number.isInteger(value) && value > 0
		? value
		: undefined;

const readString = (value: unknown): string | undefined =>
	typeof value === "string" && value.length > 0 ? value : undefined;

const readStringArray = (value: unknown): string[] =>
	Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];

const parseSub = (value: unknown): number | undefined => {
	const sub = readString(value);
	if (!sub) {
		return undefined;
	}
	const parsed = Number(sub);
	return readInt(parsed);
};

/**
 * Normalises the three JWT shapes (identity / project / legacy) into one view.
 * Role names are upper-cased so TitleCase v1.3 projectRoles ("Manager") and
 * legacy flat roles ("MANAGER") resolve the same way.
 */
const normaliseUser = (user: JwtPayload) => {
	const record = user as Record<string, unknown>;

	const userId =
		readInt(record.userId) ?? readInt(record.id) ?? parseSub(record.sub);
	const systemRole = readString(record.systemRole);
	const legacyRole = readString(record.role)?.toUpperCase();
	const organisationRole = readString(record.organisationRole);
	const organisationId = readInt(record.organisationId);
	// Present only on signed project-scoped tokens; legacy tokens rely on the x-project-id header
	const tokenProjectId = readInt(record.projectId);

	const roles = new Set(
		readStringArray(record.projectRoles).map((role) => role.toUpperCase()),
	);
	if (legacyRole && legacyRole !== LEGACY_ADMIN) {
		roles.add(legacyRole);
	}

	return {
		userId,
		isSystemAdmin: systemRole === SYSTEM_ADMIN || legacyRole === LEGACY_ADMIN,
		isOrganisationAdmin: organisationRole === ORGANISATION_ADMIN,
		organisationId,
		tokenProjectId,
		roles,
	};
};

/**
 * Resolves the caller's data scope. Pure apart from throwing AppError.
 * Precedence: SystemAdmin > OrganisationAdmin > Manager > Inspector > Farmer.
 * Multiple project roles are additive, so the most permissive one wins.
 */
export const resolveDashboardScope = ({
	user,
	projectScope,
}: ResolveScopeInput): DashboardScope => {
	const normalised = normaliseUser(user);

	if (normalised.userId === undefined) {
		throw new AppError(401, customError("AUTH_003"));
	}

	const userId = normalised.userId;
	const projectId = projectScope?.projectId;
	const noChecks = { organisationLink: false, projectMembership: false };

	if (normalised.isSystemAdmin) {
		return projectId
			? { level: "project", userId, projectId, checks: noChecks }
			: { level: "global", userId, checks: noChecks };
	}

	if (!projectId) {
		throw new AppError(403, customError("AUTH_007"));
	}

	if (normalised.isOrganisationAdmin) {
		if (normalised.organisationId === undefined) {
			throw new AppError(
				403,
				customError("TENANT_001"),
				DASHBOARD_MESSAGES.ORGANISATION_MISSING,
			);
		}
		return {
			level: "project",
			userId,
			projectId,
			organisationId: normalised.organisationId,
			checks: { organisationLink: true, projectMembership: false },
		};
	}

	// A signed project-scoped token already proves membership for the project it names.
	// The database check is only needed when the projectId came from the x-project-id
	// header (legacy tokens), which the client can set to anything.
	// [AUTH-CLEANUP] Once the header fallback is removed from projectScopeMiddleware,
	// this can become a constant `false` and ensureProjectMembership can be deleted.
	const membershipProvenByToken = normalised.tokenProjectId === projectId;
	const memberChecks = {
		organisationLink: false,
		projectMembership: !membershipProvenByToken,
	};

	if (normalised.roles.has(MANAGER)) {
		return { level: "project", userId, projectId, checks: memberChecks };
	}

	if (normalised.roles.has(INSPECTOR)) {
		return { level: "inspector", userId, projectId, checks: memberChecks };
	}

	if (normalised.roles.has(FARMER)) {
		return { level: "farmer", userId, projectId, checks: memberChecks };
	}

	throw new AppError(
		403,
		customError("AUTH_004"),
		DASHBOARD_MESSAGES.NO_DASHBOARD_ROLE,
	);
};

/**
 * Merges the resolved scope with caller-supplied filters into query conditions.
 * A projectId filter is only free-form at global level; otherwise it must match the token.
 */
export const buildScanConditions = (
	scope: DashboardScope,
	filters: DashboardFiltersQuery,
): ScanConditions => {
	if (
		scope.projectId !== undefined &&
		filters.projectId !== undefined &&
		filters.projectId !== scope.projectId
	) {
		throw new AppError(
			403,
			customError("AUTH_004"),
			DASHBOARD_MESSAGES.PROJECT_FILTER_FORBIDDEN,
		);
	}

	const conditions: ScanConditions = {
		projectId: scope.projectId ?? filters.projectId,
		year: filters.year,
		speciesId: filters.speciesId,
	};

	if (scope.level === "inspector") {
		conditions.inspectorId = scope.userId;
	}

	if (scope.level === "farmer") {
		conditions.farmerId = scope.userId;
	}

	return conditions;
};

// Prisma where fragment (no archive filter; callers decide)
export const scanConditionsToWhere = (
	conditions: ScanConditions,
): Prisma.TreeScanWhereInput => ({
	...(conditions.projectId !== undefined
		? { projectId: conditions.projectId }
		: {}),
	...(conditions.inspectorId !== undefined
		? { inspectorId: conditions.inspectorId }
		: {}),
	...(conditions.farmerId !== undefined
		? { farmerId: conditions.farmerId }
		: {}),
	...(conditions.year !== undefined
		? { estimatedPlantedYear: conditions.year }
		: {}),
	...(conditions.speciesId !== undefined
		? { speciesId: conditions.speciesId }
		: {}),
});

// Raw-SQL where fragment for the "ts" alias of tree_scans (no archive filter; callers decide).
// Every value is a bound parameter; only column names are literal.
export const scanConditionsToSql = (conditions: ScanConditions): Prisma.Sql => {
	const parts: Prisma.Sql[] = [];

	if (conditions.projectId !== undefined) {
		parts.push(Prisma.sql`ts.project_id = ${conditions.projectId}`);
	}
	if (conditions.inspectorId !== undefined) {
		parts.push(Prisma.sql`ts.inspector_id = ${conditions.inspectorId}`);
	}
	if (conditions.farmerId !== undefined) {
		parts.push(Prisma.sql`ts.farmer_id = ${conditions.farmerId}`);
	}
	if (conditions.year !== undefined) {
		parts.push(Prisma.sql`ts.estimated_planted_year = ${conditions.year}`);
	}
	if (conditions.speciesId !== undefined) {
		parts.push(Prisma.sql`ts.species_id = ${conditions.speciesId}`);
	}

	return parts.length > 0 ? Prisma.join(parts, " AND ") : Prisma.sql`TRUE`;
};