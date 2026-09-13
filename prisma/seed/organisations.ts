// Needs a country and a location id from geography.ts, an organisation has to
// belong to somewhere.
import { prisma } from "./client";

export const seedOrganisation = async (
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

// Second organisation, exists so there's something to actually test the
// project sharing feature against instead of only ever seeding a single
// owner. Needs the same country and location as seedOrganisation above.
export const seedPartnerOrganisation = async (
	countryId: number,
	locationId: number,
): Promise<number> => {
	const org = await prisma.organisation.upsert({
		where: { contactEmail: "contact@ramelau-cooperative.local" },
		update: {},
		create: {
			name: "Ramelau Community Forestry Cooperative",
			contactEmail: "contact@ramelau-cooperative.local",
			countryId,
			adminLocationId: locationId,
			description:
				"Local farmer cooperative in the Ainaro highlands, implementing partner on reforestation projects in the area.",
			accountActive: true,
			dateJoined: new Date("2024-03-10"),
		},
	});
	return org.id;
};
