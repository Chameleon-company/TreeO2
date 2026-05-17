// Dashboard Controller

import { Request, Response } from "express";
import * as DashboardService from "./dashboard.service";
import { User } from "../../types";

function isUser(obj: unknown): obj is User {
  return typeof obj === "object" && obj !== null && "role" in obj;
}

/**
 * @swagger
 * /dashboard/totals:
 *   get:
 *     summary: Get dashboard totals
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Totals by role
 */
export const getTotals = async (req: Request, res: Response): Promise<void> => {
  if (!isUser(req.user)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const result = await DashboardService.getTotals(req.user);
  res.json(result);
};

/**
 * @swagger
 * /dashboard/tree-counts:
 *   get:
 *     summary: Get dashboard tree counts
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tree counts by role
 */
export const getTreeCounts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!isUser(req.user)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const result = await DashboardService.getTreeCounts(req.user);
  res.json(result);
};

/**
 * @swagger
 * /dashboard/scan-stats:
 *   get:
 *     summary: Get dashboard scan stats
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scan stats by role
 */
export const getScanStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!isUser(req.user)) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const result = await DashboardService.getScanStats(req.user);
  res.json(result);
};
