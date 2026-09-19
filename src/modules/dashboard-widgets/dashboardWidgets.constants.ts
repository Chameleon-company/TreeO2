export const DASHBOARD_READ_PERMISSION = "dashboard:read";

export const TREE_COUNT_GROUP_BY = [
	"year",
	"project",
	"farmer",
	"inspector",
	"species",
	"farm",
] as const;
export type TreeCountGroupBy = (typeof TREE_COUNT_GROUP_BY)[number];

// "farm" is accepted by validation but not implemented: there is no Farm model
// or farm_id column on tree_scans yet (schema owned by another stream).
export const IMPLEMENTED_TREE_COUNT_GROUP_BY = [
	"year",
	"project",
	"farmer",
	"inspector",
	"species",
] as const;
export type ImplementedTreeCountGroupBy =
	(typeof IMPLEMENTED_TREE_COUNT_GROUP_BY)[number];

export const SCAN_STATS_BUCKET = ["month", "year"] as const;
export type ScanStatsBucket = (typeof SCAN_STATS_BUCKET)[number];

export const MIN_PLANTED_YEAR = 1900;
export const MAX_PLANTED_YEAR = 2100;

export const DASHBOARD_MESSAGES = {
	PROJECT_NOT_FOUND: "Project not found",
	PROJECT_FILTER_FORBIDDEN:
		"projectId filter does not match the project scope of the token",
	PROJECT_NOT_LINKED: "Project is not linked to your organisation",
	NOT_PROJECT_MEMBER: "You are not assigned to this project",
	NO_DASHBOARD_ROLE: "No project role grants dashboard access",
	ORGANISATION_MISSING: "Organisation context missing from token",
	FARM_GROUPING_NOT_IMPLEMENTED:
		"Grouping by farm is not available until the Farm model is added to the schema",
	DATE_RANGE_INVALID: "from must be earlier than or equal to to",
} as const;
