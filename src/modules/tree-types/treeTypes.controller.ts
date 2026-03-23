import type { Request, Response } from 'express';
import { getTreeTypesOverview } from './treeTypes.service';

export const listTreeTypes = async (_req: Request, res: Response): Promise<void> => {
  const response = await getTreeTypesOverview();
  res.status(200).json(response);
};
