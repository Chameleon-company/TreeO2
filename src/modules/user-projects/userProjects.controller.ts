import type { Request, Response } from 'express';
import { getUserProjectsOverview } from './userProjects.service';

export const listUserProjects = async (_req: Request, res: Response): Promise<void> => {
  const response = await getUserProjectsOverview();
  res.status(200).json(response);
};
