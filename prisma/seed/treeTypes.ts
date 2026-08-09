import { prisma } from "./client";

export const seedTreeTypes = async (): Promise<{
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
