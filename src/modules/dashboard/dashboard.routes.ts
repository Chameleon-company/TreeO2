import { Router } from "express";
import { getTotals, getTreeCounts, getScanStats } from "./dashboard.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

function asyncHandler(fn: (...args: any[]) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get("/totals", authMiddleware, asyncHandler(getTotals));
router.get("/tree-counts", authMiddleware, asyncHandler(getTreeCounts));
router.get("/scan-stats", authMiddleware, asyncHandler(getScanStats));

export default router;