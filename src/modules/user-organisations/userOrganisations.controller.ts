import type { NextFunction, Request, Response } from "express";
import {
	userOrganisationsService
} from "./userOrganisations.service";

type AddUserToOrganisationInput = {
	userId: number;
	organisationId: number;
};

type RemoveUserFromOrganisationInput = {
	userId: number;
	organisationId: number;
};

type UpdateUserOrganisationMembershipInput = {
	userId: number;
	orgId: number;
	newStatus: string;
}

export class UserOrganisationsController {
	async getUserOrganisations(req: Request, res: Response, next: NextFunction) {
		try {
			const userOrganisations = await userOrganisationsService.getUserOrganisations();

			return res.status(200).json({
				success: true,
				data: userOrganisations,
			});
		} catch (error) {
			return next(error);
		}
	}

	async addUserToOrganisation(req: Request, res: Response, next: NextFunction) {
		try {
			const payload = req.body as AddUserToOrganisationInput;

			const newUserOrganisation = await userOrganisationsService.addUserToOrganisation(
				payload.userId,
				payload.organisationId
			);

			return res.status(201).json({
				success: true,
				data: newUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}

	async updateUserMembershipStatus(req: Request, res: Response, next: NextFunction) {
		try {
			const payload = req.body as UpdateUserOrganisationMembershipInput;

			const updatedUserOrganisation = await userOrganisationsService.updateUserMembershipStatus(
				payload.userId,
				payload.orgId,
				payload.newStatus,
			);

			return res.status(200).json({
				success: true,
				data: updatedUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}

	async removeUserMembershipStatus(req: Request, res: Response, next: NextFunction) {
		try {
			const payload = req.body as RemoveUserFromOrganisationInput;

			const removedUserOrganisation = await userOrganisationsService.removeUserMembershipStatus(
				payload.userId,
				payload.organisationId,
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

export const userOrganisationsController = new UserOrganisationsController();