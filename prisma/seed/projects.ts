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
