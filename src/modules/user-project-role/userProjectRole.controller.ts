import type { NextFunction, Request, Response } from "express";
import { userProjectRoleService } from "./userProjectRole.service";
import {
	UserProjectRoleReqParams,
	type UserProjectRoleReqBody,
} from "./userProjectRole.schema";

export class UserProjectRoleController {
	async getRoles(_req: Request, res: Response, next: NextFunction) {
		try {
			const roles = await userProjectRoleService.getRoles();

			return res.status(200).json({
				success: true,
				data: roles,
			});
		} catch (error) {
			return next(error);
		}
	}

	async assignRole(req: Request, res: Response, next: NextFunction) {
		try {
			const { userId, projectId, roleId } = req.body as UserProjectRoleReqBody;

			const assignedBy = Number(req.user?.sub);

			const assignment = await userProjectRoleService.assignRole({
				userId,
				projectId,
				roleId,
				assignedBy,
			});

			return res.status(201).json({
				success: true,
				data: assignment,
			});
		} catch (error) {
			return next(error);
		}
	}

	async removeRole(req: Request, res: Response, next: NextFunction) {
		try {
			const { user_id, project_id, role_id } = UserProjectRoleReqParams.parse(
				req.params,
			);

			const result = await userProjectRoleService.removeRole(
				user_id,
				project_id,
				role_id,
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
