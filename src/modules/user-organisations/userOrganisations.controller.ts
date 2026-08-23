import type { NextFunction, Response } from "express";
import { userOrganisationsService } from "./userOrganisations.service";
import {
	AddUserOrganisationReq,
	DeleteUserOrganisationReq,
	ListUserOrganisationReq,
	UpdateUserOrganisationReq,
} from "./userOrganisations.schema";

export class UserOrganisationsController {
	async listUserOrganisations(
		req: ListUserOrganisationReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const result = await userOrganisationsService.listUserOrganisations(
				req.query.page,
				req.query.limit,
			);

			return res.status(200).json({
				success: true,
				data: result.data,
				pagination: result.pagination,
			});
		} catch (error) {
			return next(error);
		}
	}

	async addUserOrganisation(
		req: AddUserOrganisationReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const payload = req.body;

			const newUserOrganisation =
				await userOrganisationsService.addUserOrganisation(
					payload.userId,
					payload.organisationId,
					payload.status,
				);

			return res.status(201).json({
				success: true,
				data: newUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}

	async updateUserOrganisation(
		req: UpdateUserOrganisationReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const updatedUserOrganisation =
				await userOrganisationsService.updateUserOrganisation(
					req.params.userId,
					req.params.organisationId,
					req.body.status,
				);

			return res.status(200).json({
				success: true,
				data: updatedUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}

	async deleteUserOrganisation(
		req: DeleteUserOrganisationReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const userId = req.params.userId;
			const orgId = req.params.organisationId;

			const deletedUserOrganisation =
				await userOrganisationsService.deleteUserOrganisation(userId, orgId);

			return res.status(200).json({
				success: true,
				data: deletedUserOrganisation,
			});
		} catch (error) {
			return next(error);
		}
	}
}

export const userOrganisationsController = new UserOrganisationsController();
