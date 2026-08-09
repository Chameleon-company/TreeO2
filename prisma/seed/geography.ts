import { prisma } from "./client";

export const seedCountryAndLocations = async (): Promise<{
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
