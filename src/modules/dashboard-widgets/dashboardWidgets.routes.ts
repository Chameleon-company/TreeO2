import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/capability.middleware";
import { projectScopeMiddleware } from "../../middleware/projectScope.middleware";
import { validateMiddleware } from "../../middleware/validate.middleware";
import { DASHBOARD_READ_PERMISSION } from "./dashboardWidgets.constants";
import { dashboardWidgetsController } from "./dashboardWidgets.controller";
import "./dashboardWidgets.docs";
import {
	ScanStatsReq,
	TotalsReq,
	TreeCountsReq,
} from "./dashboardWidgets.schemas";

const router = Router();

// Every dashboard route: authenticated -> project scope resolved -> dashboard:read -> validated.
// Per-role data scoping (own scans / own trees / org-linked project) is applied in the service.
const dashboardGuards = [
	authMiddleware,
	projectScopeMiddleware,
	requirePermission(DASHBOARD_READ_PERMISSION),
];

router.get(
	"/totals",
	...dashboardGuards,
	validateMiddleware(TotalsReq),
	(req, res, next) => {
		// casting because validateMiddleware guarantees the shape; errors are handled by next()
		void dashboardWidgetsController
			.getTotals(req as unknown as TotalsReq, res)
			.catch(next);
	},
);

router.get(
	"/tree-counts",
	...dashboardGuards,
	validateMiddleware(TreeCountsReq),
	(req, res, next) => {
		void dashboardWidgetsController
			.getTreeCounts(req as unknown as TreeCountsReq, res)
			.catch(next);
	},
);

router.get(
	"/scan-stats",
	...dashboardGuards,
	validateMiddleware(ScanStatsReq),
	(req, res, next) => {
		void dashboardWidgetsController
			.getScanStats(req as unknown as ScanStatsReq, res)
			.catch(next);
	},
);

export default router;
