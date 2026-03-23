import type { Request, Response } from 'express';
import { getAdoptersOverview } from './adopters.service';

export const listAdopters = async (_req: Request, res: Response): Promise<void> => {
  const response = await getAdoptersOverview();
  res.status(200).json(response);
};
