import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type {
	ImplementedTreeCountGroupBy,
	ScanStatsBucket,
} from "./dashboardWidgets.constants";
import {
	scanConditionsToSql,
	type ScanConditions,
} from "./dashboardWidgets.scope";

/**
 * SHARED TREE-COUNT QUERY (single source of truth).
 *
 * A "tree" is a distinct fob_id. For each (fob_id, estimated_planted_year) the
 * latest non-archived scan by upload_timestamp is the authoritative observation.
 * Both the dashboard and the reports module MUST derive tree counts from this
 * subquery so the two never disagree (see project reference §12 step 6).
 *
 * The returned fragment is a SELECT usable as a derived table aliased "latest".
 */
export const latestScanPerFobYearSql = (
	conditions: ScanConditions,
): Prisma.Sql => Prisma.sql`
	SELECT DISTINCT ON (ts.fob_id, ts.estimated_planted_year)
		ts.id,
		ts.fob_id,
		ts.project_id,
		ts.farmer_id,
		ts.inspector_id,
		ts.species_id,
		ts.estimated_planted_year,
		ts.upload_timestamp,
		ts.height_m,
		ts.circumference_cm,
		ts.diameter_cm,
		ts.is_valid
	FROM tree_scans ts
	WHERE ts.is_archived = false AND ${scanConditionsToSql(conditions)}
	ORDER BY ts.fob_id, ts.estimated_planted_year, ts.upload_timestamp DESC, ts.id DESC
`;

// Column names are taken from this fixed map only, never from user input.
const GROUP_COLUMNS: Record<ImplementedTreeCountGroupBy, string> = {
	year: "estimated_planted_year",
	project: "project_id",
	farmer: "farmer_id",
	inspector: "inspector_id",
	species: "species_id",
};

export interface TreeCountRow {
	key: number;
	trees: number;
}

// Distinct trees per group, derived from the shared latest-scan subquery.
export const countTreesByGroup = async (
	conditions: ScanConditions,
	groupBy: ImplementedTreeCountGroupBy,
): Promise<TreeCountRow[]> => {
	const column = Prisma.raw(`latest.${GROUP_COLUMNS[groupBy]}`);

	return prisma.$queryRaw<TreeCountRow[]>(Prisma.sql`
		SELECT ${column} AS key, COUNT(DISTINCT latest.fob_id)::int AS trees
		FROM (${latestScanPerFobYearSql(conditions)}) AS latest
		GROUP BY ${column}
		ORDER BY ${column}
	`);
};

// Total distinct trees, derived from the same shared subquery.
export const countTrees = async (
	conditions: ScanConditions,
): Promise<number> => {
	const rows = await prisma.$queryRaw<Array<{ trees: number }>>(Prisma.sql`
		SELECT COUNT(DISTINCT latest.fob_id)::int AS trees
		FROM (${latestScanPerFobYearSql(conditions)}) AS latest
	`);

	return rows[0]?.trees ?? 0;
};

export interface ScanTotalsRow {
	scans: number;
	archivedScans: number;
	farmers: number;
	inspectors: number;
	species: number;
}

// One pass over tree_scans for the non-tree totals. "scans" excludes archived records.
export const countScanTotals = async (
	conditions: ScanConditions,
): Promise<ScanTotalsRow> => {
	const rows = await prisma.$queryRaw<ScanTotalsRow[]>(Prisma.sql`
		SELECT
			COUNT(*) FILTER (WHERE NOT ts.is_archived)::int AS "scans",
			COUNT(*) FILTER (WHERE ts.is_archived)::int AS "archivedScans",
			COUNT(DISTINCT ts.farmer_id) FILTER (WHERE NOT ts.is_archived)::int AS "farmers",
			COUNT(DISTINCT ts.inspector_id) FILTER (WHERE NOT ts.is_archived)::int AS "inspectors",
			COUNT(DISTINCT ts.species_id) FILTER (WHERE NOT ts.is_archived)::int AS "species"
		FROM tree_scans ts
		WHERE ${scanConditionsToSql(conditions)}
	`);

	return (
		rows[0] ?? {
			scans: 0,
			archivedScans: 0,
			farmers: 0,
			inspectors: 0,
			species: 0,
		}
	);
};

export interface ScanSeriesRow {
	bucket: Date;
	scans: number;
}

// Bucket literal comes from the enum, never from raw user input.
const BUCKET_LITERAL: Record<ScanStatsBucket, Prisma.Sql> = {
	month: Prisma.raw("'month'"),
	year: Prisma.raw("'year'"),
};

// Non-archived scans uploaded per bucket, optionally bounded by upload_timestamp.
export const countScansPerBucket = async (
	conditions: ScanConditions,
	bucket: ScanStatsBucket,
	from?: Date,
	to?: Date,
): Promise<ScanSeriesRow[]> => {
	const range: Prisma.Sql[] = [];
	if (from) {
		range.push(Prisma.sql`ts.upload_timestamp >= ${from}`);
	}
	if (to) {
		range.push(Prisma.sql`ts.upload_timestamp <= ${to}`);
	}
	const rangeSql =
		range.length > 0 ? Prisma.join(range, " AND ") : Prisma.sql`TRUE`;

	return prisma.$queryRaw<ScanSeriesRow[]>(Prisma.sql`
		SELECT date_trunc(${BUCKET_LITERAL[bucket]}, ts.upload_timestamp) AS bucket,
			COUNT(*)::int AS scans
		FROM tree_scans ts
		WHERE ts.is_archived = false
			AND ${scanConditionsToSql(conditions)}
			AND ${rangeSql}
		GROUP BY 1
		ORDER BY 1
	`);
};
