export { default as dashboardWidgetsRoutes } from "./dashboardWidgets.routes";
export { dashboardWidgetsService } from "./dashboardWidgets.service";
export { dashboardWidgetsController } from "./dashboardWidgets.controller";

// Shared tree-count query: reports MUST import from here rather than re-implementing it
export {
	latestScanPerFobYearSql,
	countTrees,
	countTreesByGroup,
} from "./dashboardWidgets.queries";
export {
	resolveDashboardScope,
	buildScanConditions,
	scanConditionsToSql,
	scanConditionsToWhere,
} from "./dashboardWidgets.scope";
export type { DashboardScope, ScanConditions } from "./dashboardWidgets.scope";
