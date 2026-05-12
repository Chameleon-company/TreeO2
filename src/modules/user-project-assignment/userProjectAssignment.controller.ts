import type { NextFunction, Request, Response } from "express";
import {
  userProjectAssignmentService,
  type AssignUserProjectInput,
} from "./userProjectAssignment.service";

type AuthenticatedUser = {
  id: number;
  role: string;
};

export class UserProjectAssignmentController {
  async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as unknown as AuthenticatedUser;

      const assignments = await userProjectAssignmentService.getAssignments(
        user.id,
        user.role,
      );

      return res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      return next(error);
    }
  }

  async assignUserToProject(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as AssignUserProjectInput;

      const assignment =
        await userProjectAssignmentService.assignUserToProject(payload);

      return res.status(201).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      return next(error);
    }
  }

  async removeUserFromProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.params.user_id);
      const projectId = Number(req.params.project_id);

      const result = await userProjectAssignmentService.removeUserFromProject(
        userId,
        projectId,
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

export const userProjectAssignmentController =
  new UserProjectAssignmentController();
