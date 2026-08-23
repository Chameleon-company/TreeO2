import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { userProjectRoleService } from "./userProjectRole.service";
import type {
	UserProjectRoleDeleteReq,
	UserProjectRoleListReq,
	UserProjectRoleReq,
} from "./userProjectRole.schema";

type ListUserProjectRolesRequest = Request<
	ParamsDictionary,
	unknown,
	unknown,
	UserProjectRoleListReq["query"]
>;

type AssignUserProjectRoleRequest = Request<
	ParamsDictionary,
	unknown,
	UserProjectRoleReq["body"]
>;

type DeleteUserProjectRoleRequest = Request<UserProjectRoleDeleteReq["params"]>;

export class UserProjectRoleController {
	async getRoles(
		req: ListUserProjectRolesRequest,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { page, limit } = req.query;

			const result = await userProjectRoleService.getRoles(page, limit);

			return res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			return next(error);
		}
	}

	async assignRole(
		req: AssignUserProjectRoleRequest,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { userId, projectId, roleId } = req.body;
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

	async removeRole(
		req: DeleteUserProjectRoleRequest,
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
