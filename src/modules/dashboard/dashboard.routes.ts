import { Router, Request, Response, NextFunction } from "express";
import { getTotals, getTreeCounts, getScanStats } from "./dashboard.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncRouteHandler): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}

router.get("/totals", authMiddleware, asyncHandler(getTotals));
router.get("/tree-counts", authMiddleware, asyncHandler(getTreeCounts));
router.get("/scan-stats", authMiddleware, asyncHandler(getScanStats));

export default router;