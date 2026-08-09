import { prisma } from "./client";

export const seedPartnersAdoptersAdoptions = async (): Promise<void> => {
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
