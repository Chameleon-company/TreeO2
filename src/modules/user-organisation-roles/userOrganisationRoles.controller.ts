import type { NextFunction, Request, Response } from "express";
import {
	userOrganisationRolesService
} from "./userOrganisationRoles.service";

type AddUserOrganisationRoleInput = {
	userId: number;
	organisationId: number;
	roleId: number;
};

export class UserOrganisationRolesController {

	async addUserOrganisationRole(req: Request, res: Response, next: NextFunction) {
		try {
			const payload = req.body as AddUserOrganisationRoleInput;

			const newUserOrganisation = await userOrganisationRolesService.addUserOrganisationRole(
				payload.userId,
				payload.organisationId,
				payload.roleId
			);

			return res.status(201).json({
				success: true,
				data: newUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}

	async removeUserOrganisationRole(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = Number(req.params.user_id);
			const orgId = Number(req.params.organisation_id);
			const roleId = Number(req.params.role_id);

			const removedUserOrganisation = await userOrganisationRolesService.removeUserOrganisationRole(
				userId,
				orgId,
				roleId
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

export const userOrganisationRolesController = new UserOrganisationRolesController();