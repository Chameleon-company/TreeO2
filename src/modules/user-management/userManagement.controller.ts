import { Request, Response } from 'express';
import { UserManagementService } from './userManagement.service';

export const UserManagementController = {
  getUsers: async (req: Request, res: Response) => {
    try {
      const { project } = req.query;
      const users = await UserManagementService.getUsers(project as string);
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch users', error: err });
    }
  },

  getUserById: async (req: Request, res: Response) => {
    try {
      const user = await UserManagementService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch user', error: err });
    }
  },

  createUser: async (req: Request, res: Response) => {
    try {
      const { name, email, roleId, projectIds } = req.body;
      if (!name || !email || !roleId)
        return res.status(400).json({ message: 'Missing required fields' });

      const user = await UserManagementService.createUser({ name, email, roleId, projectIds });
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ message: 'Failed to create user', error: err });
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const updated = await UserManagementService.updateUser(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: 'User not found' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update user', error: err });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const deleted = await UserManagementService.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'User not found' });
      res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};