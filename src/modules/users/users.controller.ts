import type { Request, Response } from 'express';
import { getUsersOverview } from './users.service';

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  const response = await getUsersOverview();
  res.status(200).json(response);
};
