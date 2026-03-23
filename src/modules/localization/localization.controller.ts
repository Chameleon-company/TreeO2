import type { Request, Response } from 'express';
import { getLocalizationOverview } from './localization.service';

export const listLocalization = async (_req: Request, res: Response): Promise<void> => {
  const response = await getLocalizationOverview();
  res.status(200).json(response);
};
