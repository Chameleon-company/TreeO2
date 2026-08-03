import { NextFunction, Response, Request } from "express";
import { projectOrganisationService } from "./projectOrganisation.service";
import {
	ProjectOrganisationReqParams,
	type ProjectOrganisationReq,
} from "./projectOrganisation.schema";

export class ProjectOrganisationController {
	async getAllProjectOrganisations(res: Response, next: NextFunction) {
		try {
			const projectOrganisations =
				await projectOrganisationService.getAllProjectOrganisations();

			return res
				.status(200)
				.json({ success: true, data: projectOrganisations });
		} catch (error) {
			return next(error);
		}
	}

	async createProjectOrganisation(
		req: ProjectOrganisationReq,
		res: Response,
		next: NextFunction,
	) {
		try {
			const body = req.body;
			const entry = await projectOrganisationService.createProjectOrganisation(
				body.projectId,
				body.organisationId,
				body.accessType,
			);
			return res.status(201).json({
				success: true,
				data: entry,
			});
		} catch (error) {
			return next(error);
		}
	}

	async deleteProjectOrganisation(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		try {
			const { projectId, organisationId } = ProjectOrganisationReqParams.parse(
				req.params,
			);

			const result = await projectOrganisationService.deleteProjectOrganisation(
				projectId,
				organisationId,
			);
			return res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			next(error);
		}
	}
}

export const projectOrganisationController =
	new ProjectOrganisationController();
