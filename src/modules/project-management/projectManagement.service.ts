import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";

// Input type for creating a new project with required and optional fields.
type CreateProjectInput = {
	name: string;
	ownerOrganisationId: number;
	description?: string | null;
	countryId: number;
	adminLocationId: number;
	isActive?: boolean;
};

// Input type for updating an existing project with optional fields for partial changes.
// T2-2026 API02: ownerOrganisationId is not a field that is allowed for updates (not specified by documentation)
type UpdateProjectInput = {
	name?: string;
	description?: string | null;
	countryId?: number;
	adminLocationId?: number;
	isActive?: boolean;
};

// Checks whether a value is a positive whole number.
const isPositiveInt = (value: unknown): value is number =>
	typeof value === "number" && Number.isInteger(value) && value > 0;

// Checks whether a value is a non-empty string after trimming spaces.
const isNonEmptyString = (value: unknown): value is string =>
	typeof value === "string" && value.trim().length > 0;

// Validates required fields for creating a project.
const assertCreatePayload = (data: CreateProjectInput) => {
	if (
		!isNonEmptyString(data.name) ||
		!isPositiveInt(data.ownerOrganisationId) ||
		!isPositiveInt(data.countryId) ||
		!isPositiveInt(data.adminLocationId)
	) {
		throw new AppError(400, customError("VAL_003"));
	}

	if (
		data.description !== undefined &&
		data.description !== null &&
		typeof data.description !== "string"
	) {
		throw new AppError(400, customError("VAL_002"), "Invalid description");
	}

	if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
		throw new AppError(400, customError("VAL_002"), "Invalid isActive value");
	}
};

// Validates provided fields for updating a project.
const assertUpdatePayload = (data: UpdateProjectInput) => {
	if (Object.keys(data).length === 0) {
		throw new AppError(
			400,
			customError("VAL_003"),
			"No fields provided for update",
		);
	}

	if (data.name !== undefined && !isNonEmptyString(data.name)) {
		throw new AppError(400, customError("VAL_002"), "Invalid project name");
	}

	if (
		data.description !== undefined &&
		data.description !== null &&
		typeof data.description !== "string"
	) {
		throw new AppError(400, customError("VAL_002"), "Invalid description");
	}

	if (data.countryId !== undefined && !isPositiveInt(data.countryId)) {
		throw new AppError(400, customError("VAL_002"), "Invalid countryId");
	}

	if (
		data.adminLocationId !== undefined &&
		!isPositiveInt(data.adminLocationId)
	) {
		throw new AppError(400, customError("VAL_002"), "Invalid adminLocationId");
	}

	if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
		throw new AppError(400, customError("VAL_002"), "Invalid isActive value");
	}
};

// Verifies that the given country exists in the database.
const ensureCountryExists = async (countryId: number) => {
	const country = await prisma.country.findUnique({
		where: { id: countryId },
		select: { id: true },
	});

	if (!country) {
		throw new AppError(404, customError("DATA_001"), "Country not found");
	}
};

// Verifies that the given location exists and returns its details.
const ensureLocationExists = async (locationId: number) => {
	const location = await prisma.location.findUnique({
		where: { id: locationId },
		select: { id: true, countryId: true },
	});

	if (!location) {
		throw new AppError(404, customError("DATA_001"), "Location not found");
	}

	return location;
};

// T2-2026 API02: verifies that organisationId (from ownerOrganisationId) exists
const ensureOrganisationExists = async (organisationId: number) => {
	const org = await prisma.organisation.findUnique({
		where: { id: organisationId },
		select: { id: true },
	});

	if (!org) {
		throw new AppError(404, customError("DATA_001"), "Organisation not found");
	}
};

// Ensures the selected admin location belongs to the selected country.
const ensureLocationBelongsToCountry = async (
	locationId: number,
	countryId: number,
) => {
	const location = await ensureLocationExists(locationId);

	if (location.countryId !== countryId) {
		throw new AppError(
			400,
			customError("VAL_001"),
			"Selected admin location does not belong to the selected country",
		);
	}
};

// Verifies that the project exists and returns its record.
const ensureProjectExists = async (id: number) => {
	const project = await prisma.project.findUnique({
		where: { id },
	});

	if (!project) {
		throw new AppError(404, customError("DATA_001"), "Project not found");
	}

	return project;
};

// Service class containing business logic for project management operations.
export class ProjectManagementService {
	// Retrieves all projects ordered by newest first.
	async getAllProjects() {
		try {
			return await prisma.project.findMany({
				orderBy: { createdAt: "desc" },
			});
		} catch {
			throw new AppError(500, customError("SYS_002"));
		}
	}

	// Retrieves a single project by its ID.
	async getProjectById(id: number) {
		if (!isPositiveInt(id)) {
			throw new AppError(400, customError("VAL_002"), "Invalid project id");
		}

		try {
			return await ensureProjectExists(id);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			throw new AppError(500, customError("SYS_002"));
		}
	}

	// Creates a new project after validation checks.
	async createProject(data: CreateProjectInput) {
		assertCreatePayload(data);

		try {
			await ensureCountryExists(data.countryId);
			await ensureOrganisationExists(data.ownerOrganisationId);
			await ensureLocationBelongsToCountry(
				data.adminLocationId,
				data.countryId,
			);

			const createdProject = await prisma.$transaction(async (tx) => {
				const project = await tx.project.create({
					data: {
						name: data.name.trim(),
						ownerOrganisationId: data.ownerOrganisationId,
						description: data.description?.trim() || null,
						countryId: data.countryId,
						adminLocationId: data.adminLocationId,
						isActive: data.isActive ?? true,
					},
				});

				await tx.projectOrganisation.create({
					data: {
						projectId: project.id,
						organisationId: project.ownerOrganisationId,
						accessType: "owner",
					},
				});

				return project;
			});

			return createdProject;
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}

			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new AppError(409, customError("DATA_002"));
			}

			throw new AppError(500, customError("SYS_002"));
		}
	}

	// Updates an existing project with provided fields.
	async updateProject(id: number, data: UpdateProjectInput) {
		if (!isPositiveInt(id)) {
			throw new AppError(400, customError("VAL_002"), "Invalid project id");
		}

		assertUpdatePayload(data);

		try {
			const existingProject = await ensureProjectExists(id);

			const nextCountryId = data.countryId ?? existingProject.countryId;
			const nextAdminLocationId =
				data.adminLocationId ?? existingProject.adminLocationId;

			if (data.countryId !== undefined) {
				await ensureCountryExists(data.countryId);
			}

			if (data.countryId !== undefined || data.adminLocationId !== undefined) {
				if (
					nextAdminLocationId === null ||
					nextAdminLocationId === undefined ||
					nextCountryId === null ||
					nextCountryId === undefined
				) {
					throw new AppError(
						400,
						customError("VAL_003"),
						"countryId and adminLocationId are required",
					);
				}

				await ensureLocationBelongsToCountry(
					nextAdminLocationId,
					nextCountryId,
				);
			}

			const updatedProject = await prisma.project.update({
				where: { id },
				data: {
					...(data.name !== undefined ? { name: data.name.trim() } : {}),
					...(data.description !== undefined
						? { description: data.description?.trim() || null }
						: {}),
					...(data.countryId !== undefined
						? { countryId: data.countryId }
						: {}),
					...(data.adminLocationId !== undefined
						? { adminLocationId: data.adminLocationId }
						: {}),
					...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
				},
			});

			return updatedProject;
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}

			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new AppError(409, customError("DATA_002"));
			}

			throw new AppError(500, customError("SYS_002"));
		}
	}

	// Deletes a project only when no dependent records exist.
	async deleteProject(id: number) {
		if (!isPositiveInt(id)) {
			throw new AppError(400, customError("VAL_002"), "Invalid project id");
		}

		try {
			await ensureProjectExists(id);

			const [
				dependentScans,
				dependentUserProjects,
				dependentProjectTreeTypes,
				dependentScanBatches,
			] = await Promise.all([
				prisma.treeScan.count({
					where: { projectId: id },
				}),
				prisma.userProject.count({
					where: { projectId: id },
				}),
				prisma.projectTreeType.count({
					where: { projectId: id },
				}),
				prisma.scanBatch.count({
					where: { projectId: id },
				}),
			]);

			if (
				dependentScans > 0 ||
				dependentUserProjects > 0 ||
				dependentProjectTreeTypes > 0 ||
				dependentScanBatches > 0
			) {
				throw new AppError(
					409,
					customError("DATA_004"),
					"Cannot delete project with dependent records",
				);
			}

			await prisma.project.delete({
				where: { id },
			});

			return {
				message: "Project deleted successfully",
			};
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}

			throw new AppError(500, customError("SYS_002"));
		}
	}
}

export const projectManagementService = new ProjectManagementService();
export type { CreateProjectInput, UpdateProjectInput };
