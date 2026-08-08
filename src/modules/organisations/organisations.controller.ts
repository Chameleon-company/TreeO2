import type { Request, Response } from "express";
import { organisationsService } from "./organisations.service";

export class OrganisationsController {
	async listOrganisations(req: Request, res: Response): Promise<void> {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 10;

		const result = await organisationsService.listOrganisations(page, limit);

		res.status(200).json({
			success: true,
			data: result.data,
			pagination: result.pagination,
		});
	}

	async getOrganisationById(req: Request, res: Response): Promise<void> {
		const id = Number(req.params.id);

		const organisation = await organisationsService.getOrganisationById(id);

		res.status(200).json({ success: true, data: organisation });
	}

	async createOrganisation(req: Request, res: Response): Promise<void> {
		const organisation = await organisationsService.createOrganisation(
			req.body as Parameters<typeof organisationsService.createOrganisation>[0],
		);

		res.status(201).json({ success: true, data: organisation });
	}

	async updateOrganisation(req: Request, res: Response): Promise<void> {
		const id = Number(req.params.id);

		const organisation = await organisationsService.updateOrganisation(
			id,
			req.body as Parameters<typeof organisationsService.updateOrganisation>[1],
		);

		res.status(200).json({ success: true, data: organisation });
	}

	async deleteOrganisation(req: Request, res: Response): Promise<void> {
		const id = Number(req.params.id);

		const organisation = await organisationsService.deactivateOrganisation(id);

		res.status(200).json({ success: true, data: organisation });
	}
}

export const organisationsController = new OrganisationsController();
