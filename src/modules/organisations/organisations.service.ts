import type { Organisation } from "@prisma/client";
import { logger } from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
import type {
	CreateOrganisationBody,
	UpdateOrganisationBody,
} from "./organisations.types";

const ORGANISATION_NOT_FOUND_MESSAGE = "Organisation not found";
const ORGANISATION_HAS_ACTIVE_USERS_MESSAGE =
	"Organisation cannot be deactivated because it has active users";
const ORGANISATION_HAS_ACTIVE_PROJECTS_MESSAGE =
	"Organisation cannot be deactivated because it has active projects";

interface PaginatedOrganisations {
	data: Organisation[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export class OrganisationsService {
	async listOrganisations(
		page: number,
		limit: number,
	): Promise<PaginatedOrganisations> {
		const skip = (page - 1) * limit;

		const [organisations, total] = await Promise.all([
			prisma.organisation.findMany({
				skip,
				take: limit,
				orderBy: { name: "asc" },
			}),
			prisma.organisation.count(),
		]);

		return {
			data: organisations,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getOrganisationById(id: number): Promise<Organisation> {
		const organisation = await prisma.organisation.findUnique({
			where: { id },
		});

		if (!organisation) {
			throw new AppError(
				404,
				ORGANISATION_NOT_FOUND_MESSAGE,
				ERROR_CODES.DATA_001,
			);
		}

		return organisation;
	}

	async createOrganisation(
		payload: CreateOrganisationBody,
	): Promise<Organisation> {
		const organisation = await prisma.organisation.create({
			data: payload,
		});

		logger.info("Organisation created", {
			organisationId: organisation.id,
			name: organisation.name,
		});

		return organisation;
	}

	async updateOrganisation(
		id: number,
		payload: UpdateOrganisationBody,
	): Promise<Organisation> {
		await this.getOrganisationById(id);

		const organisation = await prisma.organisation.update({
			where: { id },
			data: payload,
		});

		logger.info("Organisation updated", {
			organisationId: organisation.id,
			name: organisation.name,
		});

		return organisation;
	}

	async deactivateOrganisation(id: number): Promise<Organisation> {
		await this.getOrganisationById(id);

		const [activeUserCount, activeProjectCount] = await Promise.all([
			prisma.userOrganisation.count({
				where: { organisationId: id, status: "active" },
			}),
			prisma.project.count({
				where: { ownerOrganisationId: id, isActive: true },
			}),
		]);

		if (activeUserCount > 0) {
			throw new AppError(
				409,
				ORGANISATION_HAS_ACTIVE_USERS_MESSAGE,
				ERROR_CODES.DATA_002,
			);
		}

		if (activeProjectCount > 0) {
			throw new AppError(
				409,
				ORGANISATION_HAS_ACTIVE_PROJECTS_MESSAGE,
				ERROR_CODES.DATA_002,
			);
		}

		const organisation = await prisma.organisation.update({
			where: { id },
			data: { accountActive: false },
		});

		logger.info("Organisation deactivated", {
			organisationId: organisation.id,
			name: organisation.name,
		});

		return organisation;
	}
}

export const organisationsService = new OrganisationsService();
