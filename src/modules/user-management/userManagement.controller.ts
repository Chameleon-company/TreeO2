import { Request, Response } from "express";
import { UserManagementService } from "./userManagement.service";

export const UserManagementController = {

  getUsers: async (req: any, res: Response) => {
    const users = await UserManagementService.getUsers(
      req.user,
      req.query.project,
    );
    return res.json(users);
  },

  getUserById: async (req: any, res: Response) => {
    const user = await UserManagementService.getUserById(
      req.user,
      req.params.id,
    );
    return res.json(user);
  },

  createUser: async (req: any, res: Response) => {
    const user = await UserManagementService.createUser(req.body);
    return res.status(201).json(user);
  },

  updateUser: async (req: any, res: Response) => {
    const updated = await UserManagementService.updateUser(
      req.user,
      req.params.id,
      req.body,
    );
    return res.json(updated);
  },

  deleteUser: async (req: any, res: Response) => {
    await UserManagementService.deleteUser(req.params.id);
    return res.json({ message: "User deactivated successfully" });
  },
};