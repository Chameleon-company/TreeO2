import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { customError } from "../../utils/errorCodes";
import { type AccessType } from "@prisma/client";

const ensureProjectExists = async (projectId: number) => {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true },
	});

	if (!project) {
		throw new AppError(404, customError("DATA_001"), "Project not found");
	}
};

const ensureOrganisationExists = async (organisationId: number) => {
	const org = await prisma.organisation.findUnique({
		where: { id: organisationId },
		select: { id: true },
	});

	if (!org) {
		throw new AppError(404, customError("DATA_001"), "Organisation not found");
	}
};

const ensureNoOwnerAccessType = (accessType: AccessType) => {
	if (accessType === "owner") {
		throw new AppError(
			422,
			customError("VAL_002"),
			"Access type can't be owner",
		);
	}
};

// get the projectOrganisation entry
const getEntry = async (projectId: number, organisationId: number) => {
	const entry = await prisma.projectOrganisation.findUnique({
		where: {
			projectId_organisationId: {
				projectId: projectId,
				organisationId: organisationId,
			},
		},
		select: { projectId: true, organisationId: true, accessType: true },
	});

	if (!entry) {
		throw new AppError(
			404,
			customError("DATA_001"),
			"Project-organisation sharing link not found",
		);
	}

	return entry;
};

class ProjectOrganisationService {
	async getAllProjectOrganisations() {
		return await prisma.projectOrganisation.findMany({
			orderBy: { createdAt: "desc" },
		});
	}

	async createProjectOrganisation(
		projectId: number,
		organisationId: number,
		accessType: AccessType,
	) {
		await ensureProjectExists(projectId);
		await ensureOrganisationExists(organisationId);

		// business logic doesnt allow creating a project_organisation entry with accessType owner
		// owner access types are created within project create and with the project's ownerOrganisationId
		ensureNoOwnerAccessType(accessType);

		const created = await prisma.projectOrganisation.create({
			data: {
				projectId: projectId,
				organisationId: organisationId,
				accessType: accessType,
			},
		});

		return created;
	}

	async deleteProjectOrganisation(projectId: number, organisationId: number) {
		const entry = await getEntry(projectId, organisationId);
		ensureNoOwnerAccessType(entry.accessType);

		await prisma.projectOrganisation.delete({
			where: {
				projectId_organisationId: {
					projectId: projectId,
					organisationId: organisationId,
				},
			},
		});

		// TODO: revoke affected users refresh tokens, see T2-2026 API13

		return { message: "Project organisation sharing removed successfully" };
	}
}

export const projectOrganisationService = new ProjectOrganisationService();
