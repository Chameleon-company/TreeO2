// Needs the organisation, a location, and both tree type ids. A project can't
// exist without an owning organisation now that ownerOrganisationId is
// required on the table.
import { prisma } from "./client";

export const seedProject = async (
	organisationId: number,
	countryId: number,
	adminLocationId: number,
	sandalwoodId: number,
	teakId: number,
): Promise<number> => {
	let project = await prisma.project.findFirst({
		where: { name: "Ainaro Watershed Reforestation Project" },
	});

	if (!project) {
		project = await prisma.project.create({
			data: {
				name: "Ainaro Watershed Reforestation Project",
				description:
					"Community-led reforestation and erosion control across the Hatu-Builico highlands, supporting smallholder farmers around Mount Ramelau.",
				ownerOrganisationId: organisationId,
				countryId,
				adminLocationId,
				isActive: true,
			},
		});
	}

	await prisma.projectOrganisation.upsert({
		where: {
			projectId_organisationId: { projectId: project.id, organisationId },
		},
		update: {},
		create: {
			projectId: project.id,
			organisationId,
			accessType: "owner",
		},
	});

	for (const treeTypeId of [sandalwoodId, teakId]) {
		await prisma.projectTreeType.upsert({
			where: { projectId_treeTypeId: { projectId: project.id, treeTypeId } },
			update: {},
			create: { projectId: project.id, treeTypeId },
		});
	}

	return project.id;
};

// Second project, same owner as the first but a smaller footprint, just one
// tree type instead of two. Exists so there's an example of an organisation
// owning more than one project, and a project with a different tree type mix
// than the first one. Needs the organisation, a location, and one tree type
// id.
export const seedSecondProject = async (
	organisationId: number,
	countryId: number,
	adminLocationId: number,
	teakId: number,
): Promise<number> => {
	let project = await prisma.project.findFirst({
		where: { name: "Hatu-Builico Agroforestry Pilot" },
	});

	if (!project) {
		project = await prisma.project.create({
			data: {
				name: "Hatu-Builico Agroforestry Pilot",
				description:
					"Smaller-scale agroforestry pilot combining teak with existing coffee gardens in Hatu-Builico, run alongside the main watershed project.",
				ownerOrganisationId: organisationId,
				countryId,
				adminLocationId,
				isActive: true,
			},
		});
	}

	await prisma.projectOrganisation.upsert({
		where: {
			projectId_organisationId: { projectId: project.id, organisationId },
		},
		update: {},
		create: {
			projectId: project.id,
			organisationId,
			accessType: "owner",
		},
	});

	await prisma.projectTreeType.upsert({
		where: {
			projectId_treeTypeId: { projectId: project.id, treeTypeId: teakId },
		},
		update: {},
		create: { projectId: project.id, treeTypeId: teakId },
	});

	return project.id;
};

// Links the partner organisation to the first project as a shared collaborator
// rather than an owner. This is the only place any of the seed data actually
// exercises the project_organisation sharing feature, without it the whole
// table only ever gets seeded with a single owner row.
export const seedProjectSharing = async (
	projectId: number,
	organisationId: number,
): Promise<void> => {
	await prisma.projectOrganisation.upsert({
		where: {
			projectId_organisationId: { projectId, organisationId },
		},
		update: {},
		create: {
			projectId,
			organisationId,
			accessType: "shared",
		},
	});
};
