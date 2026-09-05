import type { NextFunction, Response } from "express";
import { userProjectRoleService } from "./userProjectRole.service";
import type {
	UserProjectRoleDeleteReq,
	UserProjectRoleListReq,
	UserProjectRoleReq,
} from "./userProjectRole.schema";

export class UserProjectRoleController {
	async getRoles(
		req: UserProjectRoleListReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { page, limit } = req.query;

			const result = await userProjectRoleService.getRoles(page, limit);

			return res.status(200).json({
				success: true,
				data: result.data,
				pagination: result.pagination,
			});
		} catch (error) {
			return next(error);
		}
	}

	async assignRole(
		req: UserProjectRoleReq,
		assignedBy: number,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { userId, projectId, roleId } = req.body;

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

	async removeRole(
		req: UserProjectRoleDeleteReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { user_id, project_id, role_id } = req.params;

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
