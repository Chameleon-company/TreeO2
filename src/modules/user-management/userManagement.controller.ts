import { Request, Response } from "express";
import {
  UserManagementService,
  AuthUser,
  CreateUserInput,
} from "./userManagement.service";

export const UserManagementController = {
  getUsers: async (req: Request, res: Response) => {
    const user = req.user as unknown as AuthUser;
    const project = req.query.project as string | undefined;

    const users = await UserManagementService.getUsers(user, project);
    return res.json(users);
  },

  getUserById: async (req: Request, res: Response) => {
    const user = req.user as unknown as AuthUser;
    const id = req.params.id;

    const result = await UserManagementService.getUserById(user, id);
    return res.json(result);
  },

  createUser: async (req: Request, res: Response) => {
    const body = req.body as CreateUserInput;

    const user = await UserManagementService.createUser(body);
    return res.status(201).json(user);
  },

  updateUser: async (req: Request, res: Response) => {
    const user = req.user as unknown as AuthUser;
    const id = req.params.id;
    const body = req.body as Partial<CreateUserInput>;

    const updated = await UserManagementService.updateUser(user, id, body);
    return res.json(updated);
  },

  deleteUser: async (req: Request, res: Response) => {
    const id = req.params.id;

    await UserManagementService.deleteUser(id);
    return res.json({ message: "User deactivated successfully" });
  },
};
