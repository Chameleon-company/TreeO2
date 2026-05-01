import { Request, Response } from "express";
import {
  UserManagementService,
  AuthUser,
  CreateUserInput,
} from "./userManagement.service";
import { AppError } from "../../middleware/errorHandler";

type AuthenticatedRequest = Request & {
  user?: unknown;
};

function getAuthUser(req: AuthenticatedRequest): AuthUser {
  if (!req.user || typeof req.user !== "object") {
    throw new AppError(401, "AUTH_001", "Unauthorized");
  }

  return req.user as unknown as AuthUser;
}

export const UserManagementController = {
  getUsers: async (req: AuthenticatedRequest, res: Response) => {
    const user = getAuthUser(req);
    const project = typeof req.query.project === "string" ? req.query.project : undefined;

    const result = await UserManagementService.getUsers(user, project);
    return res.json(result);
  },

  getUserById: async (req: AuthenticatedRequest, res: Response) => {
    const user = getAuthUser(req);

    const result = await UserManagementService.getUserById(
      user,
      req.params.id,
    );

    return res.json(result);
  },

  createUser: async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as CreateUserInput;

    const result = await UserManagementService.createUser(body);
    return res.status(201).json(result);
  },

  updateUser: async (req: AuthenticatedRequest, res: Response) => {
    const user = getAuthUser(req);

    const result = await UserManagementService.updateUser(
      user,
      req.params.id,
      req.body as Partial<CreateUserInput>,
    );

    return res.json(result);
  },

  deleteUser: async (req: AuthenticatedRequest, res: Response) => {
    await UserManagementService.deleteUser(req.params.id);
    return res.json({ message: "User deactivated successfully" });
  },
};