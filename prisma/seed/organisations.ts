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
