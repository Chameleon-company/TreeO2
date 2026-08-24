import type { NextFunction, Request, Response } from "express";
import {
	userOrganisationsService
} from "./userOrganisations.service";

type AddUserToOrganisationInput = {
	userId: number;
	organisationId: number;
};

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
			const userId = Number(req.params.user_id);
			const orgId = Number(req.params.organisation_id);
			const newStatus = req.body.newStatus;

			const updatedUserOrganisation = await userOrganisationsService.updateUserMembershipStatus(
				userId,
				orgId,
				newStatus,
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
			const userId = Number(req.params.user_id);
			const orgId = Number(req.params.organisation_id);

			const removedUserOrganisation = await userOrganisationsService.removeUserMembershipStatus(
				userId,
				orgId,
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