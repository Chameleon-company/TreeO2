import type { Request, Response } from 'express';
import { getProjectsOverview } from './projects.service';

export const listProjects = async (_req: Request, res: Response): Promise<void> => {
  const response = await getProjectsOverview();
  res.status(200).json(response);
};
