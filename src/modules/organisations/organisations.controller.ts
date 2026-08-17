import type { Response } from "express";
import { organisationsService } from "./organisations.service";
import type {
	CreateOrganisationReq,
	ListOrganisationsReq,
	OrganisationIdReq,
	UpdateOrganisationReq,
} from "./organisations.schemas";

export class OrganisationsController {
	async listOrganisations(
		req: ListOrganisationsReq,
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
		req: OrganisationIdReq,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.getOrganisationById(
			req.params.id,
		);

		res.status(200).json({ success: true, data: organisation });
	}

	async createOrganisation(
		req: CreateOrganisationReq,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.createOrganisation(
			req.body,
		);

		res.status(201).json({ success: true, data: organisation });
	}

	async updateOrganisation(
		req: UpdateOrganisationReq,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.updateOrganisation(
			req.params.id,
			req.body,
		);

		res.status(200).json({ success: true, data: organisation });
	}

	async deleteOrganisation(
		req: OrganisationIdReq,
		res: Response,
	): Promise<void> {
		const organisation = await organisationsService.deactivateOrganisation(
			req.params.id,
		);

		res.status(200).json({ success: true, data: organisation });
	}
}

export const organisationsController = new OrganisationsController();
