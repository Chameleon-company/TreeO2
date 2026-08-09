// Each step below needs ids from the one before it, so the order is fixed.
// See prisma/seed/README.md for the full breakdown of why.
import { prisma } from "./seed/client";
import { seedRoles } from "./seed/roles";
import { seedCountryAndLocations } from "./seed/geography";
import { seedOrganisation } from "./seed/organisations";
import { seedUsers } from "./seed/users";
import { seedTreeTypes } from "./seed/treeTypes";
import { seedProject } from "./seed/projects";
import { seedScans } from "./seed/scans";
import { seedPartnersAdoptersAdoptions } from "./seed/partnersAdoptions";
import { seedLocalization } from "./seed/localization";

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
