import type { NextFunction, Request, Response } from "express";
import {
  userProjectRoleService,
  type CreateUserProjectRoleInput,
} from "./userProjectRole.service";

type AuthenticatedUser = {
  id: number;
  role: string;
};

export class UserProjectRoleController {
  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as unknown as AuthenticatedUser;

      const roles = await userProjectRoleService.getAssignments(
        user.id,
        user.role,
      );

      return res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      return next(error);
    }
  }

  async createUserProjectRole(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as CreateUserProjectRoleInput;

      const role = await userProjectRoleService.createUserProjectRole(payload);

      return res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteUserProjectRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.params.user_id);
      const projectId = Number(req.params.project_id);
      const roleId = Number(req.params.role_id);

      const result = await userProjectRoleService.deleteUserProjectRole(
        userId,
        projectId,
        roleId,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const userProjectRoleController = new UserProjectRoleController();
