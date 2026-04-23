import { Request, Response } from 'express';
import { UserManagementService } from './userManagement.service';

/**
 * Properly typed request (NO any usage)
 */
type Params = { id?: string };
type Query = { project?: string };

type Body = {
  name?: string;
  email?: string;
  roleId?: number;
  projectIds?: number[];
};

type TypedRequest = Request<Params, unknown, Body, Query>;

export const UserManagementController = {
  getUsers: async (req: TypedRequest, res: Response): Promise<Response> => {
    try {
      const project = req.query.project;

      const users = await UserManagementService.getUsers(
        project ? String(project) : undefined
      );

      return res.json(users);
    } catch {
      return res.status(500).json({
        message: 'Failed to fetch users',
      });
    }
  },

  getUserById: async (req: TypedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID required' });
      }

      const user = await UserManagementService.getUserById(id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch {
      return res.status(500).json({
        message: 'Failed to fetch user',
      });
    }
  },

  createUser: async (req: TypedRequest, res: Response): Promise<Response> => {
    try {
      const { name, email, roleId, projectIds } = req.body;

      if (!name || !email || !roleId) {
        return res.status(400).json({
          message: 'Missing required fields',
        });
      }

      const user = await UserManagementService.createUser({
        name,
        email,
        roleId,
        projectIds,
      });

      return res.status(201).json(user);
    } catch {
      return res.status(500).json({
        message: 'Failed to create user',
      });
    }
  },

  updateUser: async (req: TypedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID required' });
      }

      const updated = await UserManagementService.updateUser(id, req.body);

      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(updated);
    } catch {
      return res.status(500).json({
        message: 'Failed to update user',
      });
    }
  },

  deleteUser: async (req: TypedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID required' });
      }

      const deleted = await UserManagementService.deleteUser(id);

      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ message: 'User deleted successfully' });
    } catch (err: unknown) {
      return res.status(400).json({
        message:
          err instanceof Error ? err.message : 'Unknown error occurred',
      });
    }
  },
};