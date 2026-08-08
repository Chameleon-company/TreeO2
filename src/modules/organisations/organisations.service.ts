import { Prisma } from "@prisma/client";
import { logger } from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { ERROR_CODES } from "../../utils/errorCodes";
import type {
	CreateOrganisationInput,
	UpdateOrganisationInput,
} from "./organisations.schemas";

const ORGANISATION_NOT_FOUND_MESSAGE = "Organisation not found";
const ORGANISATION_DUPLICATE_EMAIL_MESSAGE =
	"An organisation with this contact email already exists";
const ORGANISATION_HAS_DEPENDENCIES_MESSAGE =
	"Organisation cannot be deleted because it has active users";

interface OrganisationResponse {
	id: number;
	name: string;
	contact_email: string | null;
	government_id: string | null;
	country_id: number | null;
	admin_location_id: number | null;
	street_address: string | null;
	logo_id: string | null;
	description: string | null;
	notes: string | null;
	account_active: boolean;
	date_joined: string | null;
	created_at: string;
	updated_at: string;
}

interface OrganisationRecord {
	id: number;
	name: string;
	contactEmail: string | null;
	governmentId: string | null;
	countryId: number | null;
	adminLocationId: number | null;
	streetAddress: string | null;
	logoId: string | null;
	description: string | null;
	notes: string | null;
	accountActive: boolean;
	dateJoined: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export class OrganisationsService {
	async listOrganisations(
		page = 1,
		limit = 10,
	): Promise<{
		data: OrganisationResponse[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
		};
	}> {
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
			data: organisations.map((organisation) => this.toResponse(organisation)),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getOrganisationById(id: number): Promise<OrganisationResponse> {
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

		return this.toResponse(organisation);
	}

	async createOrganisation(
		payload: CreateOrganisationInput,
	): Promise<OrganisationResponse> {
		try {
			const organisation = await prisma.organisation.create({
				data: {
					name: payload.name,
					contactEmail: payload.contact_email ?? null,
					governmentId: payload.government_id ?? null,
					countryId: payload.country_id ?? null,
					adminLocationId: payload.admin_location_id ?? null,
					streetAddress: payload.street_address ?? null,
					logoId: payload.logo_id ?? null,
					description: payload.description ?? null,
					notes: payload.notes ?? null,
				},
			});

			logger.info("Organisation created", {
				organisationId: organisation.id,
				name: organisation.name,
			});

			return this.toResponse(organisation);
		} catch (error: unknown) {
			this.throwPersistenceConflict(error);
		}
	}

	async updateOrganisation(
		id: number,
		payload: UpdateOrganisationInput,
	): Promise<OrganisationResponse> {
		await this.getOrganisationById(id);

		try {
			const organisation = await prisma.organisation.update({
				where: { id },
				data: {
					...(payload.name !== undefined ? { name: payload.name } : {}),
					...(payload.contact_email !== undefined
						? { contactEmail: payload.contact_email }
						: {}),
					...(payload.government_id !== undefined
						? { governmentId: payload.government_id }
						: {}),
					...(payload.country_id !== undefined
						? { countryId: payload.country_id }
						: {}),
					...(payload.admin_location_id !== undefined
						? { adminLocationId: payload.admin_location_id }
						: {}),
					...(payload.street_address !== undefined
						? { streetAddress: payload.street_address }
						: {}),
					...(payload.logo_id !== undefined ? { logoId: payload.logo_id } : {}),
					...(payload.description !== undefined
						? { description: payload.description }
						: {}),
					...(payload.notes !== undefined ? { notes: payload.notes } : {}),
					...(payload.account_active !== undefined
						? { accountActive: payload.account_active }
						: {}),
				},
			});

			logger.info("Organisation updated", {
				organisationId: organisation.id,
				name: organisation.name,
			});

			return this.toResponse(organisation);
		} catch (error: unknown) {
			this.throwPersistenceConflict(error);
		}
	}

	async deactivateOrganisation(id: number): Promise<OrganisationResponse> {
		await this.getOrganisationById(id);

		const activeUserCount = await prisma.userOrganisation.count({
			where: { organisationId: id, status: "active" },
		});

		if (activeUserCount > 0) {
			throw new AppError(
				409,
				ORGANISATION_HAS_DEPENDENCIES_MESSAGE,
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

		return this.toResponse(organisation);
	}

	private throwPersistenceConflict(error: unknown): never {
		if (error instanceof AppError) {
			throw error;
		}

		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				throw new AppError(
					409,
					ORGANISATION_DUPLICATE_EMAIL_MESSAGE,
					ERROR_CODES.DATA_002,
				);
			}

			if (error.code === "P2003") {
				throw new AppError(
					409,
					"Referenced country or location does not exist",
					ERROR_CODES.DATA_002,
				);
			}
		}

		throw error;
	}

	private toResponse(organisation: OrganisationRecord): OrganisationResponse {
		return {
			id: organisation.id,
			name: organisation.name,
			contact_email: organisation.contactEmail,
			government_id: organisation.governmentId,
			country_id: organisation.countryId,
			admin_location_id: organisation.adminLocationId,
			street_address: organisation.streetAddress,
			logo_id: organisation.logoId,
			description: organisation.description,
			notes: organisation.notes,
			account_active: organisation.accountActive,
			date_joined: organisation.dateJoined
				? organisation.dateJoined.toISOString()
				: null,
			created_at: organisation.createdAt.toISOString(),
			updated_at: organisation.updatedAt.toISOString(),
		};
	}
}

export const organisationsService = new OrganisationsService();
