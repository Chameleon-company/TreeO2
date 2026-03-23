import type { Request, Response } from 'express';
import { getPartnersOverview } from './partners.service';

export const listPartners = async (_req: Request, res: Response): Promise<void> => {
  const response = await getPartnersOverview();
  res.status(200).json(response);
};
