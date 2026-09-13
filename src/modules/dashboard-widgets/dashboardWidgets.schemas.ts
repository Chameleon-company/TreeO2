import { z } from "zod";
import type { JwtPayload } from "../auth/auth.types";
import {
	DASHBOARD_MESSAGES,
	MAX_PLANTED_YEAR,
	MIN_PLANTED_YEAR,
	SCAN_STATS_BUCKET,
	TREE_COUNT_GROUP_BY,
} from "./dashboardWidgets.constants";

// query values arrive as strings, so coerce to number
const optionalPositiveInt = z.coerce.number().int().positive().optional();

const optionalPlantedYear = z.coerce
	.number()
	.int()
	.min(MIN_PLANTED_YEAR)
	.max(MAX_PLANTED_YEAR)
	.optional();

// Filters shared by all three endpoints.
// projectId is only honoured for global (SystemAdmin) scope; for project-scoped
// tokens it must match the token's project or the request is rejected.
export const DashboardFiltersQuery = z.object({
	projectId: optionalPositiveInt,
	year: optionalPlantedYear,
	speciesId: optionalPositiveInt,
});
export type DashboardFiltersQuery = z.infer<typeof DashboardFiltersQuery>;

export const TotalsReqQuery = DashboardFiltersQuery;
export type TotalsReqQuery = z.infer<typeof TotalsReqQuery>;

export const TreeCountsReqQuery = DashboardFiltersQuery.extend({
	groupBy: z.enum(TREE_COUNT_GROUP_BY).default("year"),
});
export type TreeCountsReqQuery = z.infer<typeof TreeCountsReqQuery>;

export const ScanStatsReqQuery = DashboardFiltersQuery.extend({
	from: z.coerce.date().optional(),
	to: z.coerce.date().optional(),
	bucket: z.enum(SCAN_STATS_BUCKET).default("month"),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
	message: DASHBOARD_MESSAGES.DATE_RANGE_INVALID,
	path: ["from"],
});
export type ScanStatsReqQuery = z.infer<typeof ScanStatsReqQuery>;

// Populated by authMiddleware and projectScopeMiddleware before validation runs.
// Declared here so controller request types carry it without casting inside the controller.
export interface DashboardRequestContext {
	user?: JwtPayload;
	projectScope?: { projectId: number };
}

// used for parsing req with query
export const TotalsReq = z.object({ query: TotalsReqQuery });
export type TotalsReq = z.infer<typeof TotalsReq> & DashboardRequestContext;

export const TreeCountsReq = z.object({ query: TreeCountsReqQuery });
export type TreeCountsReq = z.infer<typeof TreeCountsReq> &
	DashboardRequestContext;

export const ScanStatsReq = z.object({ query: ScanStatsReqQuery });
export type ScanStatsReq = z.infer<typeof ScanStatsReq> &
	DashboardRequestContext;
