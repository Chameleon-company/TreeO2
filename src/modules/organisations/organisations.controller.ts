import type { Response } from "express";
import { organisationsService } from "./organisations.service";
import type {
	CreateOrganisationRequest,
	ListOrganisationsRequest,
	OrganisationIdRequest,
	UpdateOrganisationRequest,
} from "./organisations.types";

export class OrganisationsController {
	async listOrganisations(
		req: ListOrganisationsRequest,
		res: Response,
	): Promise<void> {
		const { page, limit } = req.query;

		const result = await organisationsService.listOrganisations(page, limit);

		res.status(200).json({
			success: true,
			data: result.data,
			pagination: result.pagination,
		});
	}

	async getOrganisationById(
		req: OrganisationIdRequest,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.getOrganisationById(
			req.params.id,
		);

		res.status(200).json({ success: true, data: organisation });
	}

	async createOrganisation(
		req: CreateOrganisationRequest,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.createOrganisation(
			req.body,
		);

		res.status(201).json({ success: true, data: organisation });
	}

	async updateOrganisation(
		req: UpdateOrganisationRequest,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.updateOrganisation(
			req.params.id,
			req.body,
		);

		res.status(200).json({ success: true, data: organisation });
	}

	async deleteOrganisation(
		req: OrganisationIdRequest,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.deactivateOrganisation(
			req.params.id,
		);

		res.status(200).json({ success: true, data: organisation });
	}
}

export const organisationsController = new OrganisationsController();
