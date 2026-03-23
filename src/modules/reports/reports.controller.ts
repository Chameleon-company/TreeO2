import type { Request, Response } from 'express';
import { getReportsOverview } from './reports.service';

export const listReports = async (_req: Request, res: Response): Promise<void> => {
  const response = await getReportsOverview();
  res.status(200).json(response);
};
