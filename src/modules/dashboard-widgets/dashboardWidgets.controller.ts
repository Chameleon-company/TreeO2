import type { Response } from "express";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";
import type {
	DashboardRequestContext,
	ScanStatsReq,
	TotalsReq,
	TreeCountsReq,
} from "./dashboardWidgets.schemas";
import {
	dashboardWidgetsService,
	type DashboardContext,
} from "./dashboardWidgets.service";

// authMiddleware always sets req.user before these handlers run; this guard keeps the
// type narrow without a non-null assertion (Guidelines §6)
const toContext = (req: DashboardRequestContext): DashboardContext => {
	if (!req.user) {
		throw new AppError(401, customError("AUTH_003"));
	}
	return { user: req.user, projectScope: req.projectScope };
};

export class DashboardWidgetsController {
	async getTotals(req: TotalsReq, res: Response): Promise<void> {
		const data = await dashboardWidgetsService.getTotals(
			toContext(req),
			req.query,
		);

		res.status(200).json({ success: true, data });
	}

	async getTreeCounts(req: TreeCountsReq, res: Response): Promise<void> {
		const data = await dashboardWidgetsService.getTreeCounts(
			toContext(req),
			req.query,
		);

		res.status(200).json({ success: true, data });
	}

	async getScanStats(req: ScanStatsReq, res: Response): Promise<void> {
		const data = await dashboardWidgetsService.getScanStats(
			toContext(req),
			req.query,
		);

		res.status(200).json({ success: true, data });
	}
}

export const dashboardWidgetsController = new DashboardWidgetsController();
