import { PrismaClient, type AccessType } from "@prisma/client";

const prisma = new PrismaClient();

// Role names seeded here; see seedUsers() below for why insertion order matters
// for the *users* created from these roles (AUTH_DEV_MODE dev-token mapping).
const ROLE_NAMES = [
	"ADMIN",
	"FARMER",
	"MANAGER",
	"INSPECTOR",
	"DEVELOPER",
] as const;

const seedRoles = async (): Promise<
	Record<(typeof ROLE_NAMES)[number], number>
> => {
	const roles = {} as Record<(typeof ROLE_NAMES)[number], number>;

	for (const name of ROLE_NAMES) {
		const role = await prisma.role.upsert({
			where: { name },
			update: {},
			create: { name },
		});
		roles[name] = role.id;
	}

	return roles;
};

const seedCountryAndLocations = async (): Promise<{
	countryId: number;
	municipalityId: number;
	adminPostId: number;
}> => {
	const country = await prisma.country.upsert({
		where: { iso2: "TL" },
		update: {},
		create: { name: "Timor-Leste", iso2: "TL", iso3: "TLS" },
	});

	const levelDefs = [
		{ level: 1, name: "Municipality" },
		{ level: 2, name: "Administrative Post" },
	];
	for (const def of levelDefs) {
		const existing = await prisma.administrativeLevel.findFirst({
			where: { countryId: country.id, level: def.level },
		});
		if (!existing) {
			await prisma.administrativeLevel.create({
				data: { countryId: country.id, level: def.level, name: def.name },
			});
		}
	}

	let municipality = await prisma.location.findFirst({
		where: { countryId: country.id, name: "Ainaro", parentId: null },
	});
	if (!municipality) {
		municipality = await prisma.location.create({
			data: {
				countryId: country.id,
				name: "Ainaro",
				level: 1,
				code: "TL-AN",
				latitude: -8.9833,
				longitude: 125.5167,
			},
		});
	}

	let adminPost = await prisma.location.findFirst({
		where: {
			countryId: country.id,
			name: "Hatu-Builico",
			parentId: municipality.id,
		},
	});
	if (!adminPost) {
		adminPost = await prisma.location.create({
			data: {
				countryId: country.id,
				parentId: municipality.id,
				name: "Hatu-Builico",
				level: 2,
				latitude: -8.9166,
				longitude: 125.497,
			},
		});
	}

	return {
		countryId: country.id,
		municipalityId: municipality.id,
		adminPostId: adminPost.id,
	};
};

const seedOrganisation = async (
	countryId: number,
	locationId: number,
): Promise<number> => {
	const org = await prisma.organisation.upsert({
		where: { contactEmail: "contact@xpand-foundation.local" },
		update: {},
		create: {
			name: "xPand Foundation",
			contactEmail: "contact@xpand-foundation.local",
			countryId,
			adminLocationId: locationId,
			description:
				"Reforestation and smallholder livelihoods NGO operating in Timor-Leste.",
			accountActive: true,
			dateJoined: new Date("2024-01-15"),
		},
	});
	return org.id;
};

// Insertion order below determines each User row's autoincrement id, and that id
// is what matters: auth.middleware.ts's AUTH_DEV_MODE bypass hardcodes sub "1".."5"
// to ADMIN, FARMER, MANAGER, INSPECTOR, DEVELOPER, and controllers (e.g.
// treeScans.controller.ts) use req.user.sub directly as a real FK - so these
// ids must exist. Autoincrement drifts the moment anything else touches this
// table (a test run, a signup), so ids are pinned explicitly and the sequence
// is resynced after. If 1-5 are ever taken by unrelated rows, this fails loudly
// (unique constraint) instead of drifting silently. This Doesn't fix the
// middleware's hardcoded-sub design, just makes seeding resilient to it.
// TODO (AUTH05, T2 2026): once the dev bypass looks users up by email instead
// of trusting a hardcoded sub, drop the explicit ids/setval below - plain
// upsert() is enough once id no longer has to match a hardcoded value.
const seedUsers = async (
	roles: Record<(typeof ROLE_NAMES)[number], number>,
	countryId: number,
	locationId: number,
): Promise<Record<(typeof ROLE_NAMES)[number], number>> => {
	const userDefs = [
		{
			id: 1,
			role: "ADMIN",
			email: "dev-admin@treeo2.local",
			name: "Maria Amaral",
		},
		{
			id: 2,
			role: "FARMER",
			email: "dev-farmer@treeo2.local",
			name: "Domingos da Costa",
		},
		{
			id: 3,
			role: "MANAGER",
			email: "dev-manager@treeo2.local",
			name: "Jose Fernandes",
		},
		{
			id: 4,
			role: "INSPECTOR",
			email: "dev-inspector@treeo2.local",
			name: "Filomena dos Santos",
		},
		{
			id: 5,
			role: "DEVELOPER",
			email: "dev-developer@treeo2.local",
			name: "Abel Pereira",
		},
	] as const;

	const users = {} as Record<(typeof ROLE_NAMES)[number], number>;

	for (const def of userDefs) {
		const user = await prisma.user.upsert({
			where: { email: def.email },
			update: {},
			create: {
				id: def.id,
				email: def.email,
				name: def.name,
				roleId: roles[def.role],
				countryId,
				adminLocationId: locationId,
				canSignIn: true,
				accountActive: true,
				dateJoined: new Date("2024-01-20"),
			},
		});
		users[def.role] = user.id;
	}

	await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))`;

	return users;
};

const seedTreeTypes = async (): Promise<{
	sandalwoodId: number;
	teakId: number;
}> => {
	let sandalwood = await prisma.treeType.findFirst({
		where: { name: "Sandalwood" },
	});
	sandalwood ??= await prisma.treeType.create({
		data: {
			name: "Sandalwood",
			key: "sandalwood",
			scientificName: "Santalum album",
			dryWeightDensity: 920.0,
		},
	});

	let teak = await prisma.treeType.findFirst({ where: { name: "Teak" } });
	teak ??= await prisma.treeType.create({
		data: {
			name: "Teak",
			key: "teak",
			scientificName: "Tectona grandis",
			dryWeightDensity: 660.0,
		},
	});

	return { sandalwoodId: sandalwood.id, teakId: teak.id };
};

const seedProject = async (
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
			accessType: "owner" satisfies AccessType,
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

const seedScans = async (
	projectId: number,
	farmerId: number,
	inspectorId: number,
	managerId: number,
	sandalwoodId: number,
	teakId: number,
): Promise<void> => {
	let batch = await prisma.scanBatch.findFirst({
		where: { projectId, inspectorId },
	});
	batch ??= await prisma.scanBatch.create({
		data: { projectId, inspectorId, uploadedAt: new Date("2024-02-10") },
	});

	let validScan = await prisma.treeScan.findFirst({
		where: { fobId: "TL-AN-HB-000123" },
	});
	validScan ??= await prisma.treeScan.create({
		data: {
			fobId: "TL-AN-HB-000123",
			projectId,
			farmerId,
			inspectorId,
			speciesId: sandalwoodId,
			estimatedPlantedYear: 2023,
			estimatedPlantedMonth: 11,
			plantedDate: new Date("2023-11-15"),
			heightM: 1.85,
			circumferenceCm: 6.2,
			diameterCm: 1.97,
			latitude: -8.92,
			longitude: 125.5,
			batchId: batch.id,
			isValid: true,
		},
	});

	let correctedScan = await prisma.treeScan.findFirst({
		where: { fobId: "TL-AN-HB-000124" },
	});
	correctedScan ??= await prisma.treeScan.create({
		data: {
			fobId: "TL-AN-HB-000124",
			projectId,
			farmerId,
			inspectorId,
			speciesId: teakId,
			estimatedPlantedYear: 2023,
			estimatedPlantedMonth: 11,
			plantedDate: new Date("2023-11-15"),
			heightM: 2.1,
			circumferenceCm: 9.4,
			diameterCm: 2.99,
			latitude: -8.925,
			longitude: 125.505,
			batchId: batch.id,
			isCorrected: true,
			correctedBy: managerId,
			correctionReason:
				"Height was recorded as 21.0m during field capture, a decimal-place entry error on the mobile app. Corrected to 2.10m after review against photo evidence.",
			isValid: true,
		},
	});

	const existingAudit = await prisma.treeScanAudit.findFirst({
		where: { treeScanId: correctedScan.id },
	});
	if (!existingAudit) {
		await prisma.treeScanAudit.create({
			data: {
				treeScanId: correctedScan.id,
				changedBy: managerId,
				changeReason:
					"Corrected mis-entered height (21.0m -> 2.10m, decimal-place error) after photo review.",
				oldData: { heightM: "21.0" },
				newData: { heightM: "2.10" },
			},
		});
	}
};

const seedPartnersAdoptersAdoptions = async (): Promise<void> => {
	const existingPartner = await prisma.partner.findFirst({
		where: { name: "Ramelau Highlands Conservation Trust" },
	});
	if (!existingPartner) {
		await prisma.partner.create({
			data: { name: "Ramelau Highlands Conservation Trust" },
		});
	}

	let adopter = await prisma.adopter.findFirst({
		where: { name: "Robert Chen" },
	});
	adopter ??= await prisma.adopter.create({
		data: { name: "Robert Chen", email: "robert.chen@example.com" },
	});

	const existingAdoption = await prisma.adoption.findFirst({
		where: { adopterId: adopter.id, fobId: "TL-AN-HB-000123" },
	});
	if (!existingAdoption) {
		await prisma.adoption.create({
			data: {
				adopterId: adopter.id,
				fobId: "TL-AN-HB-000123",
				adoptedAt: new Date("2024-01-20"),
			},
		});
	}
};

const seedLocalization = async (): Promise<void> => {
	await prisma.culture.upsert({
		where: { code: "tet" },
		update: {},
		create: { code: "tet", name: "Tetum" },
	});

	await prisma.localizedString.upsert({
		where: {
			cultureCode_stringKey_context: {
				cultureCode: "tet",
				stringKey: "common.thank_you",
				context: "ui.common",
			},
		},
		update: {},
		create: {
			cultureCode: "tet",
			stringKey: "common.thank_you",
			value: "Obrigadu barak",
			context: "ui.common",
		},
	});
};

const main = async (): Promise<void> => {
	const roles = await seedRoles();
	const { countryId, municipalityId, adminPostId } =
		await seedCountryAndLocations();
	const organisationId = await seedOrganisation(countryId, municipalityId);
	const users = await seedUsers(roles, countryId, municipalityId);
	const { sandalwoodId, teakId } = await seedTreeTypes();
	const projectId = await seedProject(
		organisationId,
		countryId,
		adminPostId,
		sandalwoodId,
		teakId,
	);
	await seedScans(
		projectId,
		users.FARMER,
		users.INSPECTOR,
		users.MANAGER,
		sandalwoodId,
		teakId,
	);
	await seedPartnersAdoptersAdoptions();
	await seedLocalization();
};

void main()
	.catch((err: unknown) => {
		console.error("Seed failed", err);
		process.exit(1);
	})
	.finally(() => {
		// ignore error
		prisma.$disconnect().catch(() => {});
	});
