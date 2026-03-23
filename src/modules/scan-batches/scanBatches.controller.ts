import type { Request, Response } from 'express';
import { getScanBatchesOverview } from './scanBatches.service';

export const listScanBatches = async (_req: Request, res: Response): Promise<void> => {
  const response = await getScanBatchesOverview();
  res.status(200).json(response);
};
