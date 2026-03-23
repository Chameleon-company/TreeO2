import type { Request, Response } from 'express';
import { getDashboardOverview } from './dashboard.service';

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  const response = await getDashboardOverview();
  res.status(200).json(response);
};
