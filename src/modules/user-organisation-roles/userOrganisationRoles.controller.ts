import type { NextFunction, Response } from "express";
import { userOrganisationRolesService } from "./userOrganisationRoles.service";
import {
	RemoveUserOrganisationRoleReq,
	type AddUserOrganisationRoleReq,
} from "./userOrganisationRoles.schema";

export class UserOrganisationRolesController {
	async addUserOrganisationRole(
		req: AddUserOrganisationRoleReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const payload = req.body;

			const newUserOrganisation =
				await userOrganisationRolesService.addUserOrganisationRole(
					payload.userId,
					payload.organisationId,
					payload.roleId,
				);

			return res.status(201).json({
				success: true,
				data: newUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}

	async removeUserOrganisationRole(
		req: RemoveUserOrganisationRoleReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const removedUserOrganisation =
				await userOrganisationRolesService.removeUserOrganisationRole(
					req.params.userId,
					req.params.organisationId,
					req.params.roleId,
				);

			return res.status(200).json({
				success: true,
				data: removedUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}
}

export const userOrganisationRolesController =
	new UserOrganisationRolesController();
