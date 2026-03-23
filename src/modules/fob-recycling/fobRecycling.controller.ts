import type { Request, Response } from 'express';
import { getFobRecyclingOverview } from './fobRecycling.service';

export const listFobRecycling = async (_req: Request, res: Response): Promise<void> => {
  const response = await getFobRecyclingOverview();
  res.status(200).json(response);
};
