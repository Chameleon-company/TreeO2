import type { Request, Response } from 'express';
import { getAdoptionsOverview } from './adoptions.service';

export const listAdoptions = async (_req: Request, res: Response): Promise<void> => {
  const response = await getAdoptionsOverview();
  res.status(200).json(response);
};
