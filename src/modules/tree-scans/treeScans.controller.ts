import type { Request, Response } from 'express';
import { getTreeScansOverview } from './treeScans.service';

export const listTreeScans = async (_req: Request, res: Response): Promise<void> => {
  const response = await getTreeScansOverview();
  res.status(200).json(response);
};
