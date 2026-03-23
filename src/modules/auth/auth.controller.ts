import type { Request, Response } from 'express';
import { getCurrentUser, loginUser } from './auth.service';

export const login = async (req: Request, res: Response): Promise<void> => {
  void req;
  await loginUser();
  res.status(200).json({ success: true });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  const user = await getCurrentUser(req.user);

  res.status(200).json({
    success: true,
    data: user,
  });
};
